const GlobalSetting = require('../models/GlobalSetting');
const { getGlobalSettingsSync, refreshSettings } = require('./settingsCache');

const FREQUENCY_MS = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

let intervalId = null;

const shouldRunBackup = (settings) => {
  if (!settings?.backup?.autoBackup) return false;
  const freq = settings.backup.backupFrequency || 'daily';
  const period = FREQUENCY_MS[freq] || FREQUENCY_MS.daily;
  const last = settings.backup.lastBackup ? new Date(settings.backup.lastBackup).getTime() : 0;
  return Date.now() - last >= period;
};

const updateLastBackup = async () => {
  const settingsDoc = await GlobalSetting.findOne({ key: 'globalSettings' });
  const current = settingsDoc ? settingsDoc.value : {};
  const next = {
    ...current,
    backup: {
      ...(current.backup || {}),
      lastBackup: new Date().toISOString(),
    },
  };
  await GlobalSetting.findOneAndUpdate(
    { key: 'globalSettings' },
    { value: next },
    { upsert: true, new: true }
  );
  refreshSettings();
};

const startBackupScheduler = () => {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try {
      const settings = getGlobalSettingsSync();
      if (shouldRunBackup(settings)) {
        await updateLastBackup();
      }
    } catch (error) {
      console.error('[BackupScheduler] Error:', error.message);
    }
  }, 60 * 1000);
};

module.exports = { startBackupScheduler };
