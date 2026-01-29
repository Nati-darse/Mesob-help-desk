const User = require('../models/User');

// @desc    Get all technicians
// @route   GET /api/users/technicians
// @access  Private (Team Lead/Admin)
exports.getTechnicians = async (req, res) => {
    try {
        // Return all technicians globally (Mesob pool)
        const filter = { role: 'Technician' };
        const technicians = await User.find(filter)
            .select('name email department isAvailable dutyStatus companyId')
            .lean();
        res.json(technicians);
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
        const users = await User.find({}).sort({ createdAt: -1 });
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
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
            action: 'DELETE_USER',
            performedBy: req.user._id,
            targetUser: userToDelete._id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
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
