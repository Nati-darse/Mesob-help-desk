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
