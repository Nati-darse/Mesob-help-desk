const { getMaintenanceModeSync } = require('../utils/settingsCache');

const checkMaintenance = async (req, res, next) => {
  try {
    // Always allow these paths (health check, login, static assets)
    if (
      req.path === '/api/health' ||
      req.path.startsWith('/api/auth') ||
      req.path === '/'
    ) {
      return next();
    }

    const isMaintenance = getMaintenanceModeSync();

    if (isMaintenance) {
      // Allow Admins to bypass
      if (req.user && (req.user.role === 'Super Admin' || req.user.role === 'System Admin')) {
        return next();
      }

      // Deny everyone else
      return res.status(503).json({
        message: 'System is currently under maintenance. Please try again later.',
        maintenance: true
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance middleware error:', error);
    next();
  }
};

module.exports = checkMaintenance;
module.exports.enforceMaintenance = checkMaintenance;
