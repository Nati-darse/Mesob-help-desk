const User = require('../models/User');

// @desc    Get all technicians
// @route   GET /api/users/technicians
// @access  Private (Team Lead/Admin)
exports.getTechnicians = async (req, res) => {
    try {
        const technicians = await User.find({ role: 'Technician', isAvailable: true }).select('name email department');
        res.json(technicians);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
