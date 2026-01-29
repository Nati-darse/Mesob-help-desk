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
        const isMesobWorkforce = req.user.companyId === 20;
        const globalRoles = ['Admin', 'Super Admin', 'System Admin'];

        if (globalRoles.includes(req.user.role) && isMesobWorkforce) {
            // Global admins see everything
        } else if (req.user.role === 'Technician' && isMesobWorkforce) {
            // Techs see everything assigned to them across all companies
            query.technician = req.user._id;
        } else {
            // Client employees see only their company's tickets
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

        // 6. Unassigned Tickets (status is 'New' OR no technician assigned)
        const unassignedTickets = await Ticket.countDocuments({
            $or: [
                { status: 'New' },
                { technician: { $exists: false } },
                { technician: null }
            ]
        });

        // 7. Technician Availability
        const techAvailability = await User.find({ role: 'Technician' })
            .select('name isAvailable department')
            .lean();

        // 8. Recent Activity (Latest 10 tickets)
        const recentTickets = await Ticket.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('requester', 'name')
            .populate('technician', 'name')
            .lean();

        const result = {
            totalTickets,
            openTickets,
            resolvedToday,
            unassignedTickets,
            avgResolutionTime: Number(avgResolutionTime),
            ticketsByCompany,
            ticketsByPriority,
            technicianPerformance,
            technicians: techAvailability,
            recentActivity: recentTickets
        };

        await cache.set(cacheKey, result, 60);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
