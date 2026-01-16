const settings = require('../state/settings');

exports.getMaintenance = async (req, res) => {
  res.json({ maintenance: settings.getMaintenance() });
};

exports.setMaintenance = async (req, res) => {
  const { maintenance } = req.body;
  settings.setMaintenance(!!maintenance);
  res.json({ maintenance: settings.getMaintenance() });
};
