const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateToken, generateRefreshToken } = require('../utils/token');
const { sendEmail } = require('../services/notificationService');

// Helper function to log audit events
const logAuditEvent = async (userId, userEmail, userRole, action, targetType, targetId, targetName, details, req, severity = 'LOW') => {
    try {
        await AuditLog.create({
            userId,
            userEmail,
            userRole,
            action,
            targetType,
            targetId,
            targetName,
            details,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            companyId: req.user?.companyId || 1,
            severity
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

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
            isHidden: finalRole === 'System Admin' // Hide System Admins
        });

        if (user) {
            // Log user creation
            await logAuditEvent(
                user._id, user.email, user.role,
                'USER_CREATED', 'USER', user._id.toString(), user.name,
                { role: finalRole, department, companyId: user.companyId },
                req, 'MEDIUM'
            );

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
                dutyStatus: user.dutyStatus, // Include duty status
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
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        // Check for user email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            // Log failed login attempt
            await AuditLog.create({
                userId: null,
                userEmail: email,
                userRole: 'UNKNOWN',
                action: 'LOGIN_FAILED',
                targetType: 'SYSTEM',
                targetId: 'login',
                targetName: 'Login System',
                details: { reason: 'User not found', email },
                ipAddress,
                userAgent,
                companyId: 1,
                severity: 'HIGH'
            });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            // Log failed login attempt
            await logAuditEvent(
                user._id, user.email, user.role,
                'LOGIN_FAILED', 'SYSTEM', 'login', 'Login System',
                { reason: 'Invalid password' },
                req, 'HIGH'
            );
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const settings = require('../state/settings');
        if (settings.getMaintenance() && user.role !== 'System Admin') {
            return res.status(403).json({ message: 'Maintenance mode active: only System Admins can login' });
        }

        // Update login tracking
        try {
            await user.updateLoginInfo(ipAddress, userAgent);
        } catch (error) {
            console.error('Error updating login info for', email, ':', error);
            // Continue with login even if login info update fails
        }

        // Log successful login
        try {
            await logAuditEvent(
                user._id, user.email, user.role,
                'LOGIN', 'SYSTEM', 'login', 'Login System',
                { ipAddress, userAgent },
                req, 'LOW'
            );
        } catch (error) {
            console.error('Error logging audit event for', email, ':', error);
            // Continue with login even if audit logging fails
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId,
            dutyStatus: user.dutyStatus, // Include duty status for technicians
            token: generateToken(user._id),
            refreshToken: generateRefreshToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
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
                dutyStatus: user.dutyStatus, // Include duty status
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

        // Log impersonation start
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'IMPERSONATION_START', 'USER', user._id.toString(), user.name,
            { targetRole: user.role, targetCompany: user.companyId },
            req, 'CRITICAL'
        );

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
            impersonatedBy: req.user.email // Track who is impersonating
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        // Log logout
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'LOGOUT', 'SYSTEM', 'logout', 'Logout System',
            {},
            req, 'LOW'
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
