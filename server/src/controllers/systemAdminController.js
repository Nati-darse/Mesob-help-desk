const fs = require('fs');
const path = require('path');
const os = require('os');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const GlobalSetting = require('../models/GlobalSetting');
const { getAvgLatency, getLatencySeries, getSocketCount } = require('../utils/metrics');
const { getMaintenanceModeSync } = require('../utils/settingsCache');

const yearsAgo = (years) => new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);
const rangeStartFromQuery = (timeRange = '30d') => {
  const now = new Date();
  switch (String(timeRange)) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case '30d':
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

const getUploadsInfo = async () => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads');
  let files = [];
  let totalBytes = 0;
  if (fs.existsSync(uploadDir)) {
    files = fs.readdirSync(uploadDir).filter((file) => file !== 'tmp');
    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) totalBytes += stat.size;
    });
  }
  return { files, totalBytes, uploadDir };
};

const getOrphanedFiles = async () => {
  const { files } = await getUploadsInfo();
  const tickets = await Ticket.find({ 'attachments.0': { $exists: true } }).select('attachments').lean();
  const referenced = new Set();
  tickets.forEach((t) => {
    (t.attachments || []).forEach((a) => {
      if (a?.filename) referenced.add(a.filename);
      if (a?.path) referenced.add(path.basename(a.path));
    });
  });
  return files.filter((file) => !referenced.has(file));
};

// GET /api/system-admin/cleanup-stats
exports.getCleanupStats = async (req, res) => {
  try {
    const oldTicketDate = yearsAgo(2);
    const inactiveDate = yearsAgo(1);
    const oldLogsDate = yearsAgo(3);

    const oldTickets = await Ticket.countDocuments({
      status: { $in: ['Resolved', 'Closed'] },
      updatedAt: { $lt: oldTicketDate }
    });

    const inactiveUsers = await User.countDocuments({
      role: { $nin: ['System Admin', 'Super Admin'] },
      $or: [
        { lastLogin: { $lt: inactiveDate } },
        { lastLogin: null, createdAt: { $lt: inactiveDate } }
      ]
    });

    const orphanedFilesList = await getOrphanedFiles();
    const oldLogs = await AuditLog.countDocuments({ timestamp: { $lt: oldLogsDate } });

    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'tmp');
    const tempData = fs.existsSync(tempDir) ? fs.readdirSync(tempDir).length : 0;

    const duplicateGroups = await User.aggregate([
      { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' }, createdAt: { $push: '$createdAt' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    const duplicates = duplicateGroups.reduce((acc, g) => acc + (g.count - 1), 0);

    const dbStats = req.app.get('dbStats');
    const dbSize = dbStats?.dataSize || 0;
    const { totalBytes } = await getUploadsInfo();
    const storageEfficiency = orphanedFilesList.length === 0 ? 100 : Math.max(0, 100 - Math.round((orphanedFilesList.length / Math.max(1, orphanedFilesList.length + 1)) * 100));

    res.json({
      oldTickets,
      inactiveUsers,
      orphanedFiles: orphanedFilesList.length,
      oldLogs,
      tempData,
      duplicates,
      dbSizeBytes: dbSize,
      attachmentsBytes: totalBytes,
      storageEfficiency
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cleanup stats' });
  }
};

// POST /api/system-admin/bulk-cleanup
exports.runBulkCleanup = async (req, res) => {
  try {
    const { type } = req.body || {};
    const oldTicketDate = yearsAgo(2);
    const inactiveDate = yearsAgo(1);
    const oldLogsDate = yearsAgo(3);
    let result = { deleted: 0, archived: 0 };

    if (type === 'old-tickets') {
      const del = await Ticket.deleteMany({
        status: { $in: ['Resolved', 'Closed'] },
        updatedAt: { $lt: oldTicketDate }
      });
      result.deleted = del.deletedCount || 0;
    } else if (type === 'inactive-users') {
      const del = await User.deleteMany({
        role: { $nin: ['System Admin', 'Super Admin'] },
        $or: [
          { lastLogin: { $lt: inactiveDate } },
          { lastLogin: null, createdAt: { $lt: inactiveDate } }
        ]
      });
      result.deleted = del.deletedCount || 0;
    } else if (type === 'orphaned-files') {
      const orphanedFilesList = await getOrphanedFiles();
      const uploadDir = path.join(__dirname, '..', '..', 'uploads');
      orphanedFilesList.forEach((file) => {
        const filePath = path.join(uploadDir, file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      result.deleted = orphanedFilesList.length;
    } else if (type === 'audit-logs') {
      const del = await AuditLog.deleteMany({ timestamp: { $lt: oldLogsDate } });
      result.deleted = del.deletedCount || 0;
    } else if (type === 'temp-data') {
      const tempDir = path.join(__dirname, '..', '..', 'uploads', 'tmp');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => fs.unlinkSync(path.join(tempDir, file)));
        result.deleted = files.length;
      }
    } else if (type === 'duplicate-records') {
      const duplicateGroups = await User.aggregate([
        { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' }, createdAt: { $push: '$createdAt' } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      let deleted = 0;
      for (const group of duplicateGroups) {
        // keep newest
        const users = await User.find({ _id: { $in: group.ids } }).sort({ createdAt: -1 });
        const toDelete = users.slice(1).map((u) => u._id);
        if (toDelete.length) {
          const del = await User.deleteMany({ _id: { $in: toDelete } });
          deleted += del.deletedCount || 0;
        }
      }
      result.deleted = deleted;
    } else {
      return res.status(400).json({ message: 'Invalid cleanup type' });
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ message: 'Cleanup failed' });
  }
};

const toCSV = (rows) => {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => headers.map((h) => escape(r[h])).join(','));
  return [headers.join(','), ...lines].join('\n');
};

// GET /api/system-admin/export-data/:type
exports.exportData = async (req, res) => {
  try {
    const { type } = req.params;
    let rows = [];
    const oldTicketDate = yearsAgo(2);
    const inactiveDate = yearsAgo(1);
    const oldLogsDate = yearsAgo(3);

    if (type === 'old-tickets') {
      const items = await Ticket.find({ status: { $in: ['Resolved', 'Closed'] }, updatedAt: { $lt: oldTicketDate } }).lean();
      rows = items.map((t) => ({ id: t._id, title: t.title, companyId: t.companyId, status: t.status, updatedAt: t.updatedAt }));
    } else if (type === 'inactive-users') {
      const items = await User.find({
        role: { $nin: ['System Admin', 'Super Admin'] },
        $or: [{ lastLogin: { $lt: inactiveDate } }, { lastLogin: null, createdAt: { $lt: inactiveDate } }]
      }).lean();
      rows = items.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, lastLogin: u.lastLogin, createdAt: u.createdAt }));
    } else if (type === 'orphaned-files') {
      const files = await getOrphanedFiles();
      rows = files.map((f) => ({ filename: f }));
    } else if (type === 'audit-logs') {
      const items = await AuditLog.find({ timestamp: { $lt: oldLogsDate } }).lean();
      rows = items.map((l) => ({ id: l._id, action: l.action, timestamp: l.timestamp }));
    } else if (type === 'temp-data') {
      const tempDir = path.join(__dirname, '..', '..', 'uploads', 'tmp');
      const files = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
      rows = files.map((f) => ({ filename: f }));
    } else if (type === 'duplicate-records') {
      const duplicateGroups = await User.aggregate([
        { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      rows = duplicateGroups.map((g) => ({ email: g._id, duplicates: g.count }));
    } else {
      return res.status(400).json({ message: 'Invalid export type' });
    }

    const csv = toCSV(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Export failed' });
  }
};

// GET /api/system-admin/overview
exports.getSystemOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const companies = await User.distinct('companyId');
    const maintenance = getMaintenanceModeSync();
    const socketCount = getSocketCount();
    const uptimeSeconds = process.uptime();
    const latencySeries = getLatencySeries();
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(5).lean();

    res.json({
      metrics: {
        totalUsers,
        activeSockets: socketCount,
        companies: companies.length,
        uptimeSeconds,
        maintenance
      },
      latencySeries,
      recentLogs: logs
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch system overview' });
  }
};

// GET /api/system-admin/global-dashboard
exports.getGlobalDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const onlineUsers = await User.countDocuments({ dutyStatus: { $ne: 'Offline' } });
    const totalCompanies = (await User.distinct('companyId')).length;
    const activeTickets = await Ticket.countDocuments({ status: { $ne: 'Closed' } });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const resolvedToday = await Ticket.countDocuments({ status: 'Resolved', updatedAt: { $gte: startOfToday } });

    const resolvedTickets = await Ticket.find({ status: 'Resolved' }).select('createdAt updatedAt');
    let totalResolutionHours = 0;
    resolvedTickets.forEach((t) => {
      totalResolutionHours += (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
    });
    const avgResponseTime = resolvedTickets.length > 0 ? Number((totalResolutionHours / resolvedTickets.length).toFixed(1)) : 0;

    const systemLoad = Math.round((os.loadavg()[0] / os.cpus().length) * 100);
    const memUsed = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);

    const systemHealth = {
      overall: Math.max(60, 100 - Math.min(systemLoad, memUsed) / 2),
      database: 100,
      api: 100,
      storage: 100 - Math.min(memUsed, 90),
      network: 100
    };

    const alerts = [];
    if (systemLoad > 80) {
      alerts.push({
        id: 'high-load',
        type: 'warning',
        title: 'High System Load',
        message: `Load at ${systemLoad}%`,
        time: new Date().toLocaleString(),
        severity: 'medium'
      });
    }

    const now = new Date();
    const performanceData = Array.from({ length: 10 }).map((_, i) => ({
      time: new Date(now.getTime() - (9 - i) * 60000).toLocaleTimeString(),
      users: totalUsers,
      tickets: activeTickets,
      response: getAvgLatency()
    }));

    res.json({
      systemHealth,
      realtimeStats: {
        activeUsers: totalUsers,
        onlineUsers,
        totalCompanies,
        activeTickets,
        resolvedToday,
        avgResponseTime,
        systemLoad,
        storageUsed: memUsed,
        maintenance: getMaintenanceModeSync()
      },
      alerts,
      performanceData
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch global dashboard data' });
  }
};

// GET /api/system-admin/cross-tenant-analytics
exports.getCrossTenantAnalytics = async (req, res) => {
  try {
    const timeRange = req.query?.timeRange || '30d';
    const startDate = rangeStartFromQuery(timeRange);
    const ticketDateMatch = { createdAt: { $gte: startDate } };
    const resolvedDateMatch = {
      status: { $in: ['Resolved', 'Closed'] },
      updatedAt: { $gte: startDate }
    };

    const totalCompanies = (await User.distinct('companyId')).length;
    const totalUsers = await User.countDocuments({});
    const totalTickets = await Ticket.countDocuments(ticketDateMatch);
    const resolvedTickets = await Ticket.find(resolvedDateMatch).select('createdAt updatedAt companyId rating');
    let totalResolutionHours = 0;
    resolvedTickets.forEach((t) => {
      totalResolutionHours += (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
    });
    const avgResolution = resolvedTickets.length > 0 ? Number((totalResolutionHours / resolvedTickets.length).toFixed(1)) : 0;

    const companyPerformance = await Ticket.aggregate([
      { $match: ticketDateMatch },
      { $group: { _id: '$companyId', tickets: { $sum: 1 }, resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } } } },
      { $sort: { tickets: -1 } }
    ]);

    const avgResolutionByCompany = await Ticket.aggregate([
      { $match: resolvedDateMatch },
      { $project: { companyId: 1, resolutionTime: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60] } } },
      { $group: { _id: '$companyId', avgHours: { $avg: '$resolutionTime' } } },
      { $sort: { _id: 1 } }
    ]);

    const ratingsByCompany = await Ticket.aggregate([
      { $match: { ...ticketDateMatch, rating: { $exists: true, $ne: null } } },
      { $group: { _id: '$companyId', avgRating: { $avg: '$rating' } } }
    ]);

    const usersByCompany = await User.aggregate([
      { $group: { _id: '$companyId', count: { $sum: 1 } } }
    ]);

    const companyPerformanceMerged = companyPerformance.map((c) => {
      const avgRes = avgResolutionByCompany.find((r) => String(r._id) === String(c._id));
      const users = usersByCompany.find((u) => String(u._id) === String(c._id));
      const rating = ratingsByCompany.find((r) => String(r._id) === String(c._id));
      return {
        companyId: c._id,
        tickets: c.tickets,
        users: users?.count || 0,
        avgResolution: avgRes ? Number(avgRes.avgHours.toFixed(1)) : 0,
        satisfaction: rating ? Number(rating.avgRating.toFixed(1)) : 0
      };
    });

    const topCategories = await Ticket.aggregate([
      { $match: ticketDateMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const categoryDistribution = topCategories.map((c, idx) => ({
      name: c._id,
      value: c.count,
      color: ['#1e4fb1', '#0061f2', '#3f51b5', '#00bcd4', '#9c27b0'][idx % 5]
    }));

    const trendGroupId = timeRange === '7d'
      ? {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      }
      : {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    const trendLimit = timeRange === '7d' ? 7 : 6;

    const ticketTrendsRaw = await Ticket.aggregate([
      { $match: ticketDateMatch },
      {
        $group: {
          _id: trendGroupId,
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['New', 'Assigned', 'In Progress']] }, 1, 0] } },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const ticketTrends = ticketTrendsRaw.slice(-trendLimit).map((r) => ({
      month: timeRange === '7d' ? `${r._id.month}/${r._id.day}` : `${r._id.month}/${r._id.year}`,
      total: r.total,
      resolved: r.resolved,
      pending: r.pending
    }));

    const topPerformers = [];
    if (companyPerformanceMerged.length) {
      const mostActive = [...companyPerformanceMerged].sort((a, b) => b.tickets - a.tickets)[0];
      topPerformers.push({ companyId: mostActive.companyId, metric: 'Most Active', value: `${mostActive.tickets} tickets` });
    }
    if (avgResolutionByCompany.length) {
      const fastest = [...avgResolutionByCompany].sort((a, b) => a.avgHours - b.avgHours)[0];
      topPerformers.push({ companyId: fastest._id, metric: 'Fastest Resolution', value: `${fastest.avgHours.toFixed(1)}h avg` });
    }
    if (ratingsByCompany.length) {
      const best = [...ratingsByCompany].sort((a, b) => b.avgRating - a.avgRating)[0];
      topPerformers.push({ companyId: best._id, metric: 'Highest Satisfaction', value: `${best.avgRating.toFixed(1)}/5.0` });
    }

    res.json({
      timeRange,
      summary: {
        totalCompanies,
        totalUsers,
        totalTickets,
        avgResolution
      },
      companyPerformance: companyPerformanceMerged,
      ticketTrends,
      categoryDistribution,
      topPerformers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// GET /api/system-admin/system-monitor
exports.getSystemMonitor = async (req, res) => {
  try {
    const uptimeSeconds = process.uptime();
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const memPercent = Math.round((memUsed / memTotal) * 100);
    const cpuLoad = os.loadavg()[0];
    const cpuPercent = Math.round((cpuLoad / os.cpus().length) * 100);
    const dbState = req.app.get('dbState') || 'unknown';
    const dbStats = req.app.get('dbStats');
    const dbSizeBytes = dbStats?.dataSize || 0;
    const attachmentsInfo = await getUploadsInfo();
    const storageUsedBytes = (dbSizeBytes || 0) + (attachmentsInfo.totalBytes || 0);
    const storageTotalBytes = storageUsedBytes > 0 ? storageUsedBytes * 2 : 1;
    const storagePercent = Math.round((storageUsedBytes / storageTotalBytes) * 100);

    const now = new Date();
    const performanceData = Array.from({ length: 10 }).map((_, i) => ({
      time: new Date(now.getTime() - (9 - i) * 60000).toLocaleTimeString(),
      cpu: cpuPercent,
      memory: memPercent,
      network: 0
    }));

    res.json({
      systemMetrics: {
        uptimeSeconds,
        cpu: { usage: cpuPercent, cores: os.cpus().length },
        memory: { used: Number((memUsed / (1024 * 1024 * 1024)).toFixed(1)), total: Number((memTotal / (1024 * 1024 * 1024)).toFixed(1)), percentage: memPercent },
        storage: { used: Number((storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1)), total: Number((storageTotalBytes / (1024 * 1024 * 1024)).toFixed(1)), percentage: storagePercent },
        network: { inbound: 0, outbound: 0, latency: getAvgLatency() },
        database: { connections: dbStats?.connections || null, queries: null, size: Number((dbSizeBytes / (1024 * 1024 * 1024)).toFixed(2)), status: dbState }
      },
      services: [
        { name: 'API', status: 'running', port: process.env.PORT || 5000 },
        { name: 'Database', status: dbState === 'connected' ? 'running' : 'warning', port: 27017 },
        { name: 'Socket.IO', status: 'running', port: process.env.PORT || 5000 }
      ],
      alerts: [],
      performanceData
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch system monitor data' });
  }
};
