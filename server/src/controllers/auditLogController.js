const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs
// @route   GET /api/audit-logs
// @access  System Admin / Super Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const action = req.query.action;
    const performedBy = req.query.performedBy;
    const targetUser = req.query.targetUser;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const query = {};
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;
    if (targetUser) query.targetUser = targetUser;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = from;
      if (to) query.timestamp.$lte = to;
    }

    // Super Admins are scoped to their own company logs
    if (req.user.role !== 'System Admin') {
      query['metadata.companyId'] = req.user.companyId;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('performedBy', 'name email role companyId')
      .populate('targetUser', 'name email role companyId');

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};
