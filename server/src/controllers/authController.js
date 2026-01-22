const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/token');
const { sendEmail } = require('../services/notificationService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const settings = require('../state/settings');
        if (settings.getMaintenance()) {
            return res.status(503).json({ message: 'Service unavailable: maintenance mode' });
        }

        const { name, email, password, department, role, companyId } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if this is the first user
        const userCount = await User.countDocuments({});
        const finalRole = userCount === 0 ? 'Admin' : (role || 'Worker');

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            department,
            role: finalRole,
            companyId: companyId || 1,
        });

        if (user) {
            // Send welcome email
            await sendEmail(
                user.email,
                'Welcome to Mesob IT Help Desk',
                `Hello ${user.name}, your account has been created successfully as a ${user.role} in ${user.department}.`,
                `<h1>Welcome to Mesob</h1><p>Hello <b>${user.name}</b>, your account has been created successfully as a <b>${user.role}</b> in ${user.department}.</p>`
            );

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                companyId: user.companyId,
                token: generateToken(user._id),
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const settings = require('../state/settings');
        if (settings.getMaintenance() && user.role !== 'System Admin' && user.role !== 'Super Admin') {
            return res.status(403).json({ message: 'Maintenance mode active: only Admins can login' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId,
            profilePic: user.profilePic,
            token: generateToken(user._id),
            refreshToken: generateRefreshToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                companyId: user.companyId,
                profilePic: user.profilePic,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Impersonate user (System Admin only)
// @route   POST /api/auth/impersonate
// @access  Private (System Admin)
exports.impersonateUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return token as if that user logged in
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId,
            token: generateToken(user._id),
            refreshToken: generateRefreshToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, email, password, profilePic } = req.body;

        if (name) user.name = name;
        if (email) user.email = email;
        if (profilePic) user.profilePic = profilePic;
        if (password) user.password = password;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId,
            profilePic: user.profilePic,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register user (Admin only)
// @route   POST /api/auth/register-user
// @access  Private (Admin)
exports.registerUser = async (req, res) => {
    try {
        const { name, email, role, department, companyId } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password: 'Mesob@123',
            department,
            role: role || 'Worker',
            companyId: companyId || 1,
        });

        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
