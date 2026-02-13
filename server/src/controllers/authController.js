const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { generateToken, generateRefreshToken } = require('../utils/token');
const { sendEmail } = require('../services/notificationService');
const { validatePassword, generateSecurePassword } = require('../utils/passwordValidator');
const { logAudit } = require('../utils/auditLogger');
const { getAllowedDomains, getMaintenanceModeSync, getMaxFileSizeBytes } = require('../utils/settingsCache');

const isEmailDomainAllowed = (email) => {
    const allowed = getAllowedDomains();
    if (!allowed || allowed.length === 0) return true;
    const parts = String(email || '').toLowerCase().split('@');
    if (parts.length !== 2) return false;
    return allowed.map(d => String(d).toLowerCase()).includes(parts[1]);
};

const isDataImageUrl = (value) => typeof value === 'string' && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);

const saveProfileImage = (dataUrl, userId) => {
    const matches = String(dataUrl).match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!matches) {
        throw new Error('Invalid image format');
    }
    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];
    const extMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg'
    };
    const extension = extMap[mimeType];
    if (!extension) {
        throw new Error('Unsupported image type');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (!buffer || buffer.length === 0) {
        throw new Error('Empty image data');
    }
    if (buffer.length > getMaxFileSizeBytes()) {
        throw new Error('Image exceeds maximum upload size');
    }

    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `profile-${userId}-${Date.now()}.${extension}`;
    const fullPath = path.join(uploadsDir, filename);
    fs.writeFileSync(fullPath, buffer);
    return `uploads/${filename}`;
};

const removeOldProfileImage = (profilePath) => {
    try {
        const safePath = String(profilePath || '');
        if (!safePath.startsWith('uploads/profile-')) return;
        const filePath = path.join(__dirname, '..', '..', safePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch {
        // ignore file cleanup errors
    }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        if (getMaintenanceModeSync()) {
            return res.status(503).json({ message: 'Service unavailable: maintenance mode' });
        }

        const { name, email, password, department, role, companyId } = req.body;
        if (!isEmailDomainAllowed(email)) {
            return res.status(400).json({ message: 'Email domain is not allowed' });
        }

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
        const finalRole = userCount === 0 ? 'Admin' : (role || 'Employee');

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
            await logAudit({
                action: 'USER_CREATE',
                req: { ...req, user },
                targetUser: user._id,
                metadata: { selfRegistration: true, createdRole: finalRole }
            });

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

        if (getMaintenanceModeSync() && user.role !== 'System Admin' && user.role !== 'Super Admin') {
            return res.status(403).json({ message: 'Maintenance mode active: only Admins can login' });
        }

        user.lastLogin = new Date();
        await user.save();

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

        await logAudit({
            action: 'LOGIN',
            req: { ...req, user },
            targetUser: user._id,
            metadata: { role: user.role }
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

        const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const password = req.body?.password || '';
        const profilePicInput = typeof req.body?.profilePic === 'string' ? req.body.profilePic.trim() : '';
        const removeProfilePic = Boolean(req.body?.removeProfilePic);

        if (rawEmail && !isEmailDomainAllowed(rawEmail)) {
            return res.status(400).json({ message: 'Email domain is not allowed' });
        }

        if (rawEmail && rawEmail !== String(user.email).toLowerCase()) {
            const existingUser = await User.findOne({ email: rawEmail, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(409).json({ message: 'Email is already in use by another user' });
            }
        }

        const didPasswordChange = Boolean(password);
        const oldProfilePic = user.profilePic;
        let resolvedProfilePic = user.profilePic;

        if (removeProfilePic) {
            resolvedProfilePic = '';
        } else if (profilePicInput) {
            if (isDataImageUrl(profilePicInput)) {
                resolvedProfilePic = saveProfileImage(profilePicInput, user._id);
            } else {
                resolvedProfilePic = profilePicInput;
            }
        }

        if (rawName) user.name = rawName;
        if (rawEmail) user.email = rawEmail;
        user.profilePic = resolvedProfilePic;

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
        if (oldProfilePic && oldProfilePic !== user.profilePic) {
            removeOldProfileImage(oldProfilePic);
        }

        if (didPasswordChange) {
            await logAudit({
                action: 'PASSWORD_CHANGE',
                req,
                targetUser: user._id
            });
        }

        await logAudit({
            action: 'PROFILE_UPDATE',
            req,
            targetUser: user._id,
            metadata: {
                updatedFields: {
                    name: Boolean(rawName),
                    email: Boolean(rawEmail),
                    profilePic: Boolean(profilePicInput) || removeProfilePic
                }
            }
        });

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

        if (getMaintenanceModeSync() && user.role !== 'System Admin' && user.role !== 'Super Admin') {
            return res.status(403).json({ message: 'Maintenance mode active: only Admins can update password' });
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

        await logAudit({
            action: 'PASSWORD_CHANGE',
            req,
            targetUser: user._id,
            metadata: { firstLogin: true }
        });

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
        if (!isEmailDomainAllowed(email)) {
            return res.status(400).json({ message: 'Email domain is not allowed' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const finalRole = role || 'Employee';
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

        await logAudit({
            action: 'USER_CREATE',
            req,
            targetUser: user._id,
            metadata: { selfRegistration: false, createdRole: finalRole }
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
