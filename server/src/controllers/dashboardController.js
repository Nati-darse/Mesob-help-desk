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
        // Tickets by company
        const ticketsByCompany = await Ticket.aggregate([
            {
                $group: {
                    _id: '$companyId',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Active technicians
        const activeTechnicians = await User.countDocuments({
            role: 'Technician',
            isAvailable: true
        });

        // Calculate total downtime (sum of resolution times)
        const resolvedTickets = await Ticket.find({ status: 'Resolved' });
        let totalDowntime = 0;
        resolvedTickets.forEach(ticket => {
            if (ticket.updatedAt && ticket.createdAt) {
                const hours = (new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
                totalDowntime += hours;
            }
        });

        // Calculate longest response time
        let longestResponseTime = 0;
        const allTickets = await Ticket.find({ comments: { $exists: true, $ne: [] } });
        allTickets.forEach(ticket => {
            if (ticket.comments.length > 0) {
                const firstResponse = ticket.comments[0].createdAt;
                const responseTime = (new Date(firstResponse) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
                if (responseTime > longestResponseTime) {
                    longestResponseTime = responseTime;
                }
            }
        });

        const result = {
            ticketsByCompany,
            activeTechnicians,
            totalDowntime: Math.round(totalDowntime * 10) / 10,
            longestResponseTime: Math.round(longestResponseTime * 10) / 10
        };
        await cache.set(cacheKey, result, 60);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
