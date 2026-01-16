const User = require('../models/User');

// @desc    Get all technicians
// @route   GET /api/users/technicians
// @access  Private (Team Lead/Admin)
exports.getTechnicians = async (req, res) => {
    try {
        const filter = { role: 'Technician', isAvailable: true };
        const scoped = req.tenantId ? { ...filter, companyId: req.tenantId } : filter;
        const technicians = await User.find(scoped)
            .select('name email department')
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
