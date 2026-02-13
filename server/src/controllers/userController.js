const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { logAudit } = require('../utils/auditLogger');
const { generateSecurePassword } = require('../utils/passwordValidator');
const { sendEmail } = require('../services/notificationService');

// @desc    Get all technicians
// @route   GET /api/users/technicians
// @access  Private (Team Lead/Admin)
exports.getTechnicians = async (req, res) => {
    try {
        // Return all technicians globally (Mesob pool)
        const filter = { role: 'Technician' };
        const includeWorkload = req.query.includeWorkload === 'true';
        const technicians = await User.find(filter)
            .select('name email department isAvailable dutyStatus companyId')
            .lean();
        if (!includeWorkload) {
            return res.json(technicians);
        }

        const techIds = technicians.map((tech) => tech._id);
        const match = {
            technician: { $in: techIds },
            status: { $nin: ['Resolved', 'Closed'] }
        };
        if (req.tenantId) {
            match.companyId = req.tenantId;
        }

        const counts = await Ticket.aggregate([
            { $match: match },
            { $group: { _id: '$technician', count: { $sum: 1 } } }
        ]);

        const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
        const withWorkload = technicians.map((tech) => ({
            ...tech,
            currentTickets: countMap.get(String(tech._id)) || 0
        }));

        res.json(withWorkload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update user availability
// @route   PUT /api/users/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isAvailable = isAvailable;
        await user.save();

        await logAudit({
            action: 'USER_AVAILABILITY',
            req,
            targetUser: user._id,
            metadata: { isAvailable }
        });

        res.json({ success: true, isAvailable: user.isAvailable });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (System Admin)
// @route   GET /api/users/global
// @access  Private (System Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'System Admin' } }).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (System Admin)
// @route   PUT /api/users/:id/role
// @access  Private (System Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        await logAudit({
            action: 'USER_ROLE_CHANGE',
            req,
            targetUser: user._id,
            metadata: { newRole: role }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (System Admin / Super Admin)
// @route   DELETE /api/users/:id
// @access  Private (System Admin, Super Admin)
exports.deleteUser = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deletion of System Admin accounts
        if (userToDelete.role === 'System Admin') {
            return res.status(403).json({ message: 'Cannot delete System Admin accounts' });
        }

        // Prevent users from deleting themselves
        if (userToDelete._id.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: 'Cannot delete your own account' });
        }

        // Create audit log before deletion
        await logAudit({
            action: 'DELETE_USER',
            req,
            targetUser: userToDelete._id,
            metadata: {
                adminName: req.user.name,
                adminEmail: req.user.email,
                adminRole: req.user.role,
                deletedUserName: userToDelete.name,
                deletedUserEmail: userToDelete.email,
                deletedUserRole: userToDelete.role,
                deletedUserCompany: userToDelete.companyId
            }
        });

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        console.log(`[SECURITY] User deleted: ${userToDelete.email} (${userToDelete.role}) by ${req.user.email} (${req.user.role})`);

        res.json({ 
            message: 'User deleted successfully',
            deletedUser: {
                name: userToDelete.name,
                email: userToDelete.email,
                role: userToDelete.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset user password (System Admin / Super Admin)
// @route   POST /api/users/:id/reset-password
// @access  Private (System Admin, Super Admin)
exports.resetUserPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const tempPassword = generateSecurePassword();
        user.password = tempPassword;
        user.isFirstLogin = true;
        await user.save();

        await logAudit({
            action: 'PASSWORD_CHANGE',
            req,
            targetUser: user._id,
            metadata: { reset: true }
        });

        try {
            await sendEmail(
                user.email,
                'Mesob Help Desk - Password Reset',
                `Your password has been reset. Temporary password: ${tempPassword}`,
                `<p>Your password has been reset.</p><p><b>Temporary Password:</b> ${tempPassword}</p>`
            );
        } catch (error) {
            // ignore email failure
        }

        res.json({ success: true, temporaryPassword: tempPassword });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
