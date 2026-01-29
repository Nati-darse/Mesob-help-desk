const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/token');
const { sendEmail } = require('../services/notificationService');
const { validatePassword, generateSecurePassword } = require('../utils/passwordValidator');

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

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                message: 'Password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if this is the first user
        const userCount = await User.countDocuments({});
        const finalRole = userCount === 0 ? 'Admin' : (role || 'Worker');

        // Centralized workforce enforcement: Technicians and Admins must be in Company 20
        const mesobRoles = ['Technician', 'Admin', 'Super Admin', 'System Admin'];
        let userCompanyId = companyId || 1;
        let userDept = department;

        if (mesobRoles.includes(finalRole)) {
            userCompanyId = 20;
            userDept = 'Mesob-Digitalization-Team/IT-Support';
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            department: userDept,
            role: finalRole,
            companyId: userCompanyId,
        });

        if (user) {
            // Send welcome email (non-blocking)
            try {
                await sendEmail(
                    user.email,
                    'Welcome to Mesob IT Help Desk',
                    `Hello ${user.name}, your account has been created successfully as a ${user.role} in ${user.department}.`,
                    `<h1>Welcome to Mesob</h1><p>Hello <b>${user.name}</b>, your account has been created successfully as a <b>${user.role}</b> in ${user.department}.</p>`
                );
            } catch (emailError) {
                console.error('[Email Error] Failed to send welcome email:', emailError.message);
                // Continue anyway - user is created
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                companyId: user.companyId,
                dutyStatus: user.dutyStatus,
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

        // Check for user email - include isFirstLogin in selection
        const user = await User.findOne({ email }).select('+password +isAvailable +dutyStatus +isFirstLogin');
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
            dutyStatus: user.dutyStatus || 'Online',
            isAvailable: user.isAvailable ?? true,
            profilePic: user.profilePic,
            isFirstLogin: user.isFirstLogin ?? false,
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
                dutyStatus: user.dutyStatus || 'Online',
                isAvailable: user.isAvailable ?? true,
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
        const AuditLog = require('../models/AuditLog');

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create audit log
        await AuditLog.create({
            action: 'IMPERSONATE',
            performedBy: req.user._id,
            targetUser: user._id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
                adminName: req.user.name,
                adminEmail: req.user.email,
                targetName: user.name,
                targetEmail: user.email,
                targetRole: user.role
            }
        });

        console.log(`[SECURITY] Impersonation: ${req.user.email} (${req.user.role}) -> ${user.email} (${user.role})`);

        // Return token as if that user logged in
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId,
            dutyStatus: user.dutyStatus,
            token: generateToken(user._id),
            refreshToken: generateRefreshToken(user._id),
            impersonatedBy: req.user._id, // Flag for frontend
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

        // Validate password if being changed
        if (password) {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    message: 'Password does not meet requirements',
                    errors: passwordValidation.errors
                });
            }
            user.password = password;
        }

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

// @desc    Change password on first login
// @route   PUT /api/auth/change-first-password
// @access  Private
exports.changeFirstPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password +isFirstLogin');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                message: 'New password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        // Update password and mark first login as complete
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        res.json({
            message: 'Password changed successfully',
            isFirstLogin: false
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
        const { name, email, role, companyId } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const finalRole = role || 'Worker';
        const mesobRoles = ['Technician', 'Admin', 'Super Admin', 'System Admin'];
        let userCompanyId = companyId || 1;
        let userDept = 'General';

        if (mesobRoles.includes(finalRole)) {
            userCompanyId = 20;
            userDept = 'Mesob-Digitalization-Team/IT-Support';
        }

        // Use default password for all new users
        const defaultPassword = 'Mesob@123';

        const user = await User.create({
            name,
            email,
            password: defaultPassword,
            role: finalRole,
            companyId: userCompanyId,
            department: userDept,
            isFirstLogin: true
        });

        // Send password to user via email (non-blocking)
        try {
            await sendEmail(
                user.email,
                'Your Mesob Help Desk Account',
                `Hello ${user.name}, your account has been created. Your temporary password is: ${defaultPassword}. Please change it after your first login.`,
                `<h2>Welcome to Mesob Help Desk</h2><p>Hello <b>${user.name}</b>,</p><p>Your account has been created as a <b>${user.role}</b>.</p><p><b>Temporary Password:</b> <code>${defaultPassword}</code></p><p><b>Important:</b> Please change your password after your first login for security.</p>`
            );
        } catch (emailError) {
            console.error('[Email Error] Failed to send password email:', emailError.message);
            // Continue anyway - user is created, just log the error
        }

        res.status(201).json({
            ...user.toObject(),
            temporaryPassword: defaultPassword // Include in response since email might fail
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
