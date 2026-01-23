const GlobalSetting = require('../models/GlobalSetting');

exports.getMaintenance = async (req, res) => {
  try {
    const setting = await GlobalSetting.findOne({ key: 'maintenance' });
    res.json({ maintenance: setting ? setting.value : false });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance status' });
  }
};

exports.setMaintenance = async (req, res) => {
  const { maintenance } = req.body;
  try {
    const setting = await GlobalSetting.findOneAndUpdate(
      { key: 'maintenance' },
      {
        value: !!maintenance,
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );
    res.json({ maintenance: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Error updating maintenance status' });
  }
};

exports.getSMTP = async (req, res) => {
  try {
    const setting = await GlobalSetting.findOne({ key: 'smtp' });
    res.json(setting ? setting.value : { host: '', port: '', user: '', pass: '' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SMTP settings' });
  }
};

exports.setSMTP = async (req, res) => {
  const smtpSettings = req.body;
  try {
    const setting = await GlobalSetting.findOneAndUpdate(
      { key: 'smtp' },
      {
        value: smtpSettings,
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: 'Error updating SMTP settings' });
  }
};
