const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Broadcast a message
// @route   POST /api/notifications/broadcast
// @access  System Admin
exports.broadcastMessage = async (req, res) => {
    try {
        const { message, priority, targetType, targetValue } = req.body;

        const notification = await Notification.create({
            message,
            priority,
            targetType,
            targetValue,
            sender: req.user._id
        });

        // Socket.io emission
        const io = req.app.get('io');

        // Determine channel based on target
        if (targetType === 'all') {
            io.emit('broadcast_message', notification);
        } else if (targetType === 'company') {
            io.to(`company:${targetValue}`).emit('broadcast_message', notification);
        } else {
            // For role or specific targets, we might emit to 'all' and let client filter
            // OR we can implement specific rooms for roles if we had them.
            // For simplicity/robustness, we'll emit to all connected clients and let them filter
            // based on the payload data, or specialized room logic if scale permits.
            // Given current socket setup (company rooms), let's just emit to all "authenticated" sockets?
            // Actually, best to just emit to everyone and let client decide if they care.
            io.emit('broadcast_message', notification);
        }

        res.status(201).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
    try {
        const user = req.user;

        // Find notifications that target 'all', or my company, or my role
        const notifications = await Notification.find({
            $or: [
                { targetType: 'all' },
                { targetType: 'company', targetValue: String(user.companyId) },
                { targetType: 'role', targetValue: user.role }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
