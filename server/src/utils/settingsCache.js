const GlobalSetting = require('../models/GlobalSetting');
const { DEFAULT_GLOBAL_SETTINGS } = require('./globalSettingsDefaults');

const CACHE_TTL_MS = 30000;
let cache = {
  globalSettings: DEFAULT_GLOBAL_SETTINGS,
  smtp: null,
  maintenance: false,
  lastFetch: 0,
  refreshing: false
};

const mergeDefaults = (defaults, value) => {
  if (!value) return defaults;
  return {
    ...defaults,
    ...value,
    system: { ...defaults.system, ...(value.system || {}) },
    security: { ...defaults.security, ...(value.security || {}) },
    notifications: { ...defaults.notifications, ...(value.notifications || {}) },
    backup: { ...defaults.backup, ...(value.backup || {}) },
    meta: { ...defaults.meta, ...(value.meta || {}) }
  };
};

const refreshSettings = async () => {
  if (cache.refreshing) return;
  cache.refreshing = true;
  try {
    const [globalSetting, smtpSetting, maintenanceSetting] = await Promise.all([
      GlobalSetting.findOne({ key: 'globalSettings' }),
      GlobalSetting.findOne({ key: 'smtp' }),
      GlobalSetting.findOne({ key: 'maintenance' })
    ]);
    cache.globalSettings = mergeDefaults(DEFAULT_GLOBAL_SETTINGS, globalSetting ? globalSetting.value : null);
    cache.smtp = smtpSetting ? smtpSetting.value : null;
    cache.maintenance = maintenanceSetting ? Boolean(maintenanceSetting.value) : false;
    cache.lastFetch = Date.now();
  } catch (error) {
    console.error('[SettingsCache] Refresh failed:', error.message);
  } finally {
    cache.refreshing = false;
  }
};

const getGlobalSettingsSync = () => {
  const now = Date.now();
  if (now - cache.lastFetch > CACHE_TTL_MS) {
    refreshSettings();
  }
  return cache.globalSettings || DEFAULT_GLOBAL_SETTINGS;
};

const getSmtpSettingsSync = () => {
  const now = Date.now();
  if (now - cache.lastFetch > CACHE_TTL_MS) {
    refreshSettings();
  }
  return cache.smtp || null;
};

const getMaintenanceModeSync = () => {
  const now = Date.now();
  if (now - cache.lastFetch > CACHE_TTL_MS) {
    refreshSettings();
  }
  return Boolean(cache.maintenance);
};

const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getMaxFileSizeBytes = () => {
  const settings = getGlobalSettingsSync();
  const mb = parseNumber(settings.system?.maxFileSize, 10);
  return Math.max(1, mb) * 1024 * 1024;
};

const getLoginAttemptsLimit = () => {
  const settings = getGlobalSettingsSync();
  return parseNumber(settings.system?.maxLoginAttempts, 5);
};

const getJwtExpiry = () => {
  const settings = getGlobalSettingsSync();
  const explicit = settings.security?.jwtExpiry;
  if (explicit && String(explicit).trim()) return explicit;
  const minutes = parseNumber(settings.system?.sessionTimeout, 30);
  return `${Math.max(5, minutes)}m`;
};

const isRateLimitingEnabled = () => {
  const settings = getGlobalSettingsSync();
  return settings.system?.rateLimiting !== false;
};

const isEmailNotificationsEnabled = () => {
  const settings = getGlobalSettingsSync();
  return settings.notifications?.emailNotifications !== false;
};

const isSmsNotificationsEnabled = () => {
  const settings = getGlobalSettingsSync();
  return settings.notifications?.smsNotifications === true;
};

const isCriticalAlertsEnabled = () => {
  const settings = getGlobalSettingsSync();
  return settings.notifications?.criticalAlerts !== false;
};

const getAllowedDomains = () => {
  const settings = getGlobalSettingsSync();
  return Array.isArray(settings.security?.allowedDomains) ? settings.security.allowedDomains : [];
};

module.exports = {
  refreshSettings,
  getGlobalSettingsSync,
  getSmtpSettingsSync,
  getMaintenanceModeSync,
  getMaxFileSizeBytes,
  getLoginAttemptsLimit,
  getJwtExpiry,
  isRateLimitingEnabled,
  isEmailNotificationsEnabled,
  isSmsNotificationsEnabled,
  isCriticalAlertsEnabled,
  getAllowedDomains
};
