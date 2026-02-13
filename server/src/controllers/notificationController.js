const Notification = require('../models/Notification');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

const ALLOWED_TARGET_TYPES = ['all', 'company', 'role', 'specific'];
const ALLOWED_PRIORITIES = ['info', 'warning', 'error'];
const ALLOWED_ROLE_TARGETS = ['Employee', 'Technician', 'Team Lead', 'Admin', 'Super Admin', 'System Admin'];

// @desc    Broadcast a message
// @route   POST /api/notifications/broadcast
// @access  System Admin
exports.broadcastMessage = async (req, res) => {
    try {
        const sender = req.user;
        const message = String(req.body?.message || '').trim();
        const priority = ALLOWED_PRIORITIES.includes(req.body?.priority) ? req.body.priority : 'info';
        const targetType = String(req.body?.targetType || 'all').trim();
        let targetValue = String(req.body?.targetValue || '').trim();
        let targetCompanyId = null;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }
        if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
            return res.status(400).json({ message: 'Invalid target type' });
        }
        if (targetType !== 'all' && !targetValue) {
            return res.status(400).json({ message: 'Target value is required' });
        }

        // Super Admins are tenant-scoped: no platform-wide broadcasts.
        if (sender.role === 'Super Admin' && targetType === 'all') {
            return res.status(403).json({ message: 'Super Admin cannot send global broadcasts. Use company or role target.' });
        }

        if (targetType === 'company') {
            const parsedCompany = Number(targetValue);
            if (Number.isNaN(parsedCompany)) {
                return res.status(400).json({ message: 'Invalid company target' });
            }
            if (sender.role === 'Super Admin' && parsedCompany !== Number(sender.companyId)) {
                return res.status(403).json({ message: 'Super Admin can only broadcast to their own organization.' });
            }
            targetValue = String(parsedCompany);
            targetCompanyId = parsedCompany;
        }

        if (targetType === 'role') {
            if (!ALLOWED_ROLE_TARGETS.includes(targetValue)) {
                return res.status(400).json({ message: 'Invalid role target' });
            }
            // Super Admin role-broadcasts are restricted to their own company.
            if (sender.role === 'Super Admin') {
                targetCompanyId = Number(sender.companyId);
            } else {
                const explicitScope = Number(req.body?.targetCompanyId);
                if (!Number.isNaN(explicitScope)) {
                    targetCompanyId = explicitScope;
                }
            }
        }

        if (targetType === 'specific') {
            const targetUser = await User.findById(targetValue).select('_id companyId');
            if (!targetUser) {
                return res.status(404).json({ message: 'Target user not found' });
            }
            if (sender.role === 'Super Admin' && Number(targetUser.companyId) !== Number(sender.companyId)) {
                return res.status(403).json({ message: 'Super Admin can only message users in their own organization.' });
            }
            targetValue = String(targetUser._id);
            targetCompanyId = Number(targetUser.companyId);
        }

        const notification = await Notification.create({
            message,
            priority,
            targetType,
            targetValue: targetType === 'all' ? '' : targetValue,
            targetCompanyId,
            sender: sender._id
        });

        await logAudit({
            action: 'BROADCAST_SEND',
            req,
            metadata: { targetType, targetValue, targetCompanyId, priority }
        });

        // Socket.io emission
        const io = req.app.get('io');

        const payload = await Notification.findById(notification._id).populate('sender', 'name email role');

        // Determine channel based on target
        if (targetType === 'all') {
            io.emit('broadcast_message', payload);
        } else if (targetType === 'company') {
            io.to(`company:${targetValue}`).emit('broadcast_message', payload);
        } else if (targetType === 'role') {
            if (targetCompanyId) {
                io.to(`company:${targetCompanyId}:role:${targetValue}`).emit('broadcast_message', payload);
            } else {
                io.to(`role:${targetValue}`).emit('broadcast_message', payload);
            }
        } else if (targetType === 'specific') {
            io.to(`user:${targetValue}`).emit('broadcast_message', payload);
        }

        res.status(201).json(payload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get recent broadcasts
// @route   GET /api/notifications/broadcasts
// @access  System Admin / Super Admin
exports.getBroadcasts = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
        const query = {};

        if (req.user?.role === 'Super Admin') {
            const myCompany = Number(req.user.companyId);
            query.$or = [
                { sender: req.user._id },
                { targetType: 'all' },
                { targetType: 'company', targetValue: String(myCompany) },
                { targetType: 'role', targetCompanyId: myCompany },
                { targetType: 'role', targetCompanyId: null },
                { targetType: 'specific', targetValue: String(req.user._id) }
            ];
        }

        const broadcasts = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'name email role');
        res.json(broadcasts);
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
        const companyId = Number(user.companyId);
        const userId = String(user._id);

        const notifications = await Notification.find({
            $or: [
                { targetType: 'all' },
                { targetType: 'company', targetValue: String(companyId) },
                { targetType: 'role', targetValue: user.role, targetCompanyId: null },
                { targetType: 'role', targetValue: user.role, targetCompanyId: companyId },
                { targetType: 'specific', targetValue: userId }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
