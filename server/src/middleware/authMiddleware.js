const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getGlobalSettingsSync } = require('../utils/settingsCache');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.toLowerCase().startsWith('bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ message: 'Not authorized, token missing' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentTokenVersion = Number(getGlobalSettingsSync()?.meta?.tokenVersion || 1);
            const tokenVersion = Number(decoded?.tv || 1);
            if (tokenVersion !== currentTokenVersion) {
                return res.status(401).json({ message: 'Session expired due to security update. Please login again.' });
            }

            // Get user from the token
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                console.warn(`[AUTH] User not found for ID: ${decoded.id}`);
                return res.status(401).json({ message: 'Not authorized, user no longer exists' });
            }

            req.user = user;

            // Debug logging for production troubleshooting
            if (process.env.NODE_ENV === 'production') {
                console.log(`[AUTH] Verified: ${user.email} (${user.role}) - Path: ${req.path}`);
            }

            return next();
        } catch (error) {
            console.error('[AUTH] Token verification failed:', error.message);
            return res.status(401).json({
                message: 'Not authorized, token failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        const normalizeRole = (role) => {
            if (!role) return '';
            return String(role)
                .replace(/[_-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        };

        const userRole = normalizeRole(req.user.role);
        const allowed = roles.map(normalizeRole);

        if (!allowed.includes(userRole)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
