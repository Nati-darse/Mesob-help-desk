const jwt = require('jsonwebtoken');

// Generate Access Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '24h', // Extended to 24 hours for better user experience
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
};

module.exports = { generateToken, generateRefreshToken };
