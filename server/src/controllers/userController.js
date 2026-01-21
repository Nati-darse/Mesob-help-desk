const User = require('../models/User');

// @desc    Get all technicians
// @route   GET /api/users/technicians
// @access  Private (Team Lead/Admin)
exports.getTechnicians = async (req, res) => {
    try {
        const filter = { role: 'Technician', isAvailable: true, isHidden: { $ne: true } };
        const scoped = req.tenantId ? { ...filter, companyId: req.tenantId } : filter;
        const technicians = await User.find(scoped)
            .select('name email department dutyStatus dutyStatusUpdatedAt')
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
        // System Admins can see all users including hidden ones
        const users = await User.findIncludingHidden({}).sort({ createdAt: -1 });
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

        // Force MESOB company for technicians
        if (role === 'Technician') {
            user.companyId = 1; // MESOB Internal
            user.department = 'IT Support'; // Default department for technicians
        }

        user.role = role;
        await user.save();

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new user (Admin)
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, department, companyId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Force MESOB company for technicians
        let finalCompanyId = companyId;
        let finalDepartment = department;
        
        if (role === 'Technician') {
            finalCompanyId = 1; // MESOB Internal
            finalDepartment = 'IT Support'; // Default department for technicians
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            department: finalDepartment,
            companyId: finalCompanyId
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
