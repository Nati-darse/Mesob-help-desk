const settings = require('../state/settings');

const enforceMaintenance = (req, res, next) => {
  const active = settings.getMaintenance();
  if (active && req.user && req.user.role !== 'System Admin') {
    return res.status(503).json({ message: 'Service unavailable: maintenance mode' });
  }
  next();
};

module.exports = { enforceMaintenance };

