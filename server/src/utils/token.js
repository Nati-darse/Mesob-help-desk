const jwt = require('jsonwebtoken');
const { getJwtExpiry, getGlobalSettingsSync } = require('./settingsCache');

// Generate Access Token
const generateToken = (id) => {
    const expiry = getJwtExpiry();
    const tokenVersion = Number(getGlobalSettingsSync()?.meta?.tokenVersion || 1);
    return jwt.sign({ id, tv: tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: expiry,
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    const tokenVersion = Number(getGlobalSettingsSync()?.meta?.tokenVersion || 1);
    return jwt.sign({ id, tv: tokenVersion }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
};

module.exports = { generateToken, generateRefreshToken };
