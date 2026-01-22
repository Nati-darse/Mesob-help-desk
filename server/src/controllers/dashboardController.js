const Ticket = require('../models/Ticket');
const User = require('../models/User');
const cache = require('../services/cache');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const cacheKey = `stats:${req.user.companyId || 'global'}`;
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const query = {};
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin' && req.user.role !== 'System Admin') {
            query.companyId = req.user.companyId;
        }

        const totalTickets = await Ticket.countDocuments(query);
        const openTickets = await Ticket.countDocuments({ ...query, status: { $ne: 'Closed' } });
        const resolvedTickets = await Ticket.countDocuments({ ...query, status: 'Resolved' });
        const closedTickets = await Ticket.countDocuments({ ...query, status: 'Closed' });

        // Stats by priority
        const priorityStats = await Ticket.aggregate([
            { $match: query },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Stats by category
        const categoryStats = await Ticket.aggregate([
            { $match: query },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const result = {
            totalTickets,
            openTickets,
            resolvedTickets,
            closedTickets,
            priorityStats,
            categoryStats
        };
        await cache.set(cacheKey, result, 60);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get admin statistics (system-wide)
// @route   GET /api/dashboard/admin-stats
// @access  Private (Admin/Super Admin)
exports.getAdminStats = async (req, res) => {
    try {
        const cacheKey = 'admin-stats';
        const cached = await cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // 1. Basic Counts
        const totalTickets = await Ticket.countDocuments({});
        const openTickets = await Ticket.countDocuments({ status: { $ne: 'Closed' } });
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const resolvedToday = await Ticket.countDocuments({
            status: 'Resolved',
            updatedAt: { $gte: startOfToday }
        });

        // 2. Average Resolution Time & Total Downtime
        const resolvedTickets = await Ticket.find({ status: 'Resolved' });
        let totalResolutionHours = 0;
        resolvedTickets.forEach(ticket => {
            if (ticket.updatedAt && ticket.createdAt) {
                const hours = (new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
                totalResolutionHours += hours;
            }
        });
        const avgResolutionTime = resolvedTickets.length > 0 
            ? (totalResolutionHours / resolvedTickets.length).toFixed(1) 
            : 0;

        // 3. Tickets by Company
        const ticketsByCompany = await Ticket.aggregate([
            {
                $group: {
                    _id: '$companyId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Tickets by Priority
        const ticketsByPriority = await Ticket.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]).then(items => {
            // Map colors to priority
            const colors = { 'Critical': '#f44336', 'High': '#ff9800', 'Medium': '#2196f3', 'Low': '#4caf50' };
            return items.map(item => ({
                priority: item._id,
                count: item.count,
                color: colors[item._id] || '#9e9e9e'
            }));
        });

        // 5. Technician Performance
        // This is complex. We'll aggregate resolved tickets by technician
        const technicianPerformance = await Ticket.aggregate([
            { $match: { status: 'Resolved', technician: { $exists: true } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'technician',
                    foreignField: '_id',
                    as: 'techInfo'
                }
            },
            { $unwind: '$techInfo' },
            {
                $project: {
                    techName: '$techInfo.name',
                    resolutionTime: {
                        $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60] // in hours
                    }
                }
            },
            {
                $group: {
                    _id: '$techName',
                    resolved: { $sum: 1 },
                    avgTime: { $avg: '$resolutionTime' }
                }
            },
            {
                $project: {
                    name: '$_id',
                    resolved: 1,
                    avgTime: { $round: ['$avgTime', 1] },
                    _id: 0
                }
            }
        ]);

        const result = {
            totalTickets,
            openTickets,
            resolvedToday,
            avgResolutionTime: Number(avgResolutionTime),
            ticketsByCompany,
            ticketsByPriority,
            technicianPerformance
        };

        await cache.set(cacheKey, result, 60);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
