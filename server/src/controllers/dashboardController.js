const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const openTickets = await Ticket.countDocuments({ status: { $ne: 'Closed' } });
        const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
        const closedTickets = await Ticket.countDocuments({ status: 'Closed' });

        // Stats by priority
        const priorityStats = await Ticket.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        // Stats by category
        const categoryStats = await Ticket.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        res.json({
            totalTickets,
            openTickets,
            resolvedTickets,
            closedTickets,
            priorityStats,
            categoryStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
