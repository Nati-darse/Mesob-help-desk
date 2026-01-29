const rateLimit = require('express-rate-limit');

// Login rate limiter - 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Registration rate limiter - 3 registrations per hour
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        message: 'Too many accounts created from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter for sensitive operations - 3 attempts per hour
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        message: 'Too many attempts, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    apiLimiter,
    strictLimiter
};
