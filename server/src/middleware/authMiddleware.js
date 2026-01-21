const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired, please login again',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid token',
                    code: 'INVALID_TOKEN'
                });
            } else {
                return res.status(401).json({ 
                    message: 'Not authorized',
                    code: 'AUTH_ERROR'
                });
            }
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
