const GlobalSetting = require('../models/GlobalSetting');
const nodemailer = require('nodemailer');
const { logAudit } = require('../utils/auditLogger');
const { DEFAULT_GLOBAL_SETTINGS } = require('../utils/globalSettingsDefaults');
const { refreshSettings } = require('../utils/settingsCache');

const DIGEST_FREQUENCIES = new Set(['hourly', 'daily', 'weekly', 'never']);
const BACKUP_FREQUENCIES = new Set(['hourly', 'daily', 'weekly']);
const JWT_EXPIRY_REGEX = /^\d+\s*[smhdw]$/i;

const clampInt = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const toStringValue = (value, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return fallback;
};

const normalizeDomains = (value, fallback = DEFAULT_GLOBAL_SETTINGS.security.allowedDomains) => {
  const raw = Array.isArray(value)
    ? value
    : toStringValue(value)
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
  const sanitized = [...new Set(raw.map((domain) => domain.toLowerCase()))]
    .filter((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain));
  return sanitized.length > 0 ? sanitized : fallback;
};

const normalizeIpWhitelist = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => toStringValue(entry)).filter(Boolean))];
};

const normalizeGlobalSettings = (value = {}) => {
  const systemInput = value.system || {};
  const securityInput = value.security || {};
  const notificationsInput = value.notifications || {};
  const backupInput = value.backup || {};
  const metaInput = value.meta || {};

  const normalizedJwtExpiry = toStringValue(
    securityInput.jwtExpiry,
    DEFAULT_GLOBAL_SETTINGS.security.jwtExpiry
  );

  return {
    system: {
      maxFileSize: String(
        clampInt(
          systemInput.maxFileSize,
          Number(DEFAULT_GLOBAL_SETTINGS.system.maxFileSize),
          1,
          500
        )
      ),
      sessionTimeout: String(
        clampInt(
          systemInput.sessionTimeout,
          Number(DEFAULT_GLOBAL_SETTINGS.system.sessionTimeout),
          5,
          1440
        )
      ),
      autoBackup: toBoolean(systemInput.autoBackup, DEFAULT_GLOBAL_SETTINGS.system.autoBackup),
      debugMode: toBoolean(systemInput.debugMode, DEFAULT_GLOBAL_SETTINGS.system.debugMode),
      rateLimiting: toBoolean(systemInput.rateLimiting, DEFAULT_GLOBAL_SETTINGS.system.rateLimiting),
      maxLoginAttempts: String(
        clampInt(
          systemInput.maxLoginAttempts,
          Number(DEFAULT_GLOBAL_SETTINGS.system.maxLoginAttempts),
          1,
          50
        )
      )
    },
    security: {
      jwtExpiry: JWT_EXPIRY_REGEX.test(normalizedJwtExpiry)
        ? normalizedJwtExpiry
        : DEFAULT_GLOBAL_SETTINGS.security.jwtExpiry,
      passwordMinLength: String(
        clampInt(
          securityInput.passwordMinLength,
          Number(DEFAULT_GLOBAL_SETTINGS.security.passwordMinLength),
          6,
          128
        )
      ),
      requireTwoFactor: toBoolean(
        securityInput.requireTwoFactor,
        DEFAULT_GLOBAL_SETTINGS.security.requireTwoFactor
      ),
      allowedDomains: normalizeDomains(securityInput.allowedDomains),
      ipWhitelist: normalizeIpWhitelist(securityInput.ipWhitelist)
    },
    notifications: {
      emailNotifications: toBoolean(
        notificationsInput.emailNotifications,
        DEFAULT_GLOBAL_SETTINGS.notifications.emailNotifications
      ),
      smsNotifications: toBoolean(
        notificationsInput.smsNotifications,
        DEFAULT_GLOBAL_SETTINGS.notifications.smsNotifications
      ),
      pushNotifications: toBoolean(
        notificationsInput.pushNotifications,
        DEFAULT_GLOBAL_SETTINGS.notifications.pushNotifications
      ),
      digestFrequency: DIGEST_FREQUENCIES.has(notificationsInput.digestFrequency)
        ? notificationsInput.digestFrequency
        : DEFAULT_GLOBAL_SETTINGS.notifications.digestFrequency,
      criticalAlerts: toBoolean(
        notificationsInput.criticalAlerts,
        DEFAULT_GLOBAL_SETTINGS.notifications.criticalAlerts
      )
    },
    backup: {
      autoBackup: toBoolean(backupInput.autoBackup, DEFAULT_GLOBAL_SETTINGS.backup.autoBackup),
      backupFrequency: BACKUP_FREQUENCIES.has(backupInput.backupFrequency)
        ? backupInput.backupFrequency
        : DEFAULT_GLOBAL_SETTINGS.backup.backupFrequency,
      retentionDays: String(
        clampInt(
          backupInput.retentionDays,
          Number(DEFAULT_GLOBAL_SETTINGS.backup.retentionDays),
          1,
          3650
        )
      ),
      cloudBackup: toBoolean(backupInput.cloudBackup, DEFAULT_GLOBAL_SETTINGS.backup.cloudBackup),
      lastBackup: backupInput.lastBackup || DEFAULT_GLOBAL_SETTINGS.backup.lastBackup
    },
    meta: {
      lastKeyRotation: metaInput.lastKeyRotation || DEFAULT_GLOBAL_SETTINGS.meta.lastKeyRotation,
      tokenVersion: clampInt(
        metaInput.tokenVersion,
        Number(DEFAULT_GLOBAL_SETTINGS.meta.tokenVersion || 1),
        1,
        1000000
      )
    }
  };
};

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
    await logAudit({
      action: 'MAINTENANCE_UPDATE',
      req,
      metadata: { maintenance: setting.value }
    });
    await refreshSettings();
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
  const smtpSettings = req.body || {};
  try {
    const existing = await GlobalSetting.findOne({ key: 'smtp' });
    const existingPass = toStringValue(existing?.value?.pass, '');
    const incomingPass = toStringValue(smtpSettings.pass, '');
    const host = toStringValue(smtpSettings.host, '');
    const user = toStringValue(smtpSettings.user, '');
    const secure = toBoolean(smtpSettings.secure, false);
    const port = String(clampInt(smtpSettings.port, 587, 1, 65535));

    if (!host) {
      return res.status(400).json({ message: 'SMTP host is required' });
    }

    const sanitizedSmtp = {
      host,
      port,
      user,
      pass: incomingPass || existingPass,
      secure
    };

    const setting = await GlobalSetting.findOneAndUpdate(
      { key: 'smtp' },
      {
        value: sanitizedSmtp,
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );
    await logAudit({
      action: 'SMTP_UPDATE',
      req,
      metadata: { host: sanitizedSmtp.host, port: sanitizedSmtp.port, user: sanitizedSmtp.user }
    });
    await refreshSettings();
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: 'Error updating SMTP settings' });
  }
};

exports.getGlobalSettings = async (req, res) => {
  try {
    const setting = await GlobalSetting.findOne({ key: 'globalSettings' });
    const normalized = normalizeGlobalSettings(setting ? setting.value : DEFAULT_GLOBAL_SETTINGS);
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching global settings' });
  }
};

exports.setGlobalSettings = async (req, res) => {
  const settingsPayload = req.body || {};
  try {
    const currentSetting = await GlobalSetting.findOne({ key: 'globalSettings' });
    const current = currentSetting ? currentSetting.value : DEFAULT_GLOBAL_SETTINGS;

    const mergedInput = {
      system: { ...(current.system || {}), ...(settingsPayload.system || {}) },
      security: { ...(current.security || {}), ...(settingsPayload.security || {}) },
      notifications: { ...(current.notifications || {}), ...(settingsPayload.notifications || {}) },
      backup: { ...(current.backup || {}), ...(settingsPayload.backup || {}) },
      meta: { ...(current.meta || {}), ...(settingsPayload.meta || {}) }
    };
    const normalizedSettings = normalizeGlobalSettings(mergedInput);

    const setting = await GlobalSetting.findOneAndUpdate(
      { key: 'globalSettings' },
      {
        value: normalizedSettings,
        updatedBy: req.user._id
      },
      { upsert: true, new: true }
    );
    await logAudit({
      action: 'SETTINGS_UPDATE',
      req,
      metadata: {
        system: normalizedSettings.system,
        security: {
          ...normalizedSettings.security,
          allowedDomainsCount: normalizedSettings.security.allowedDomains.length,
          ipWhitelistCount: normalizedSettings.security.ipWhitelist.length
        },
        notifications: normalizedSettings.notifications,
        backup: normalizedSettings.backup
      }
    });
    await refreshSettings();
    res.json(setting.value);
  } catch (error) {
    res.status(500).json({ message: 'Error updating global settings' });
  }
};

exports.testEmail = async (req, res) => {
  try {
    const { to, smtp } = req.body || {};
    if (!to) {
      return res.status(400).json({ message: 'Test email address is required' });
    }
    let smtpSettings = smtp;
    if (!smtpSettings || !smtpSettings.host) {
      const setting = await GlobalSetting.findOne({ key: 'smtp' });
      smtpSettings = setting ? setting.value : null;
    }
    if (!smtpSettings || !smtpSettings.host) {
      return res.status(400).json({ message: 'SMTP settings are missing' });
    }
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: Number(smtpSettings.port) || 587,
      secure: Boolean(smtpSettings.secure),
      auth: smtpSettings.user ? { user: smtpSettings.user, pass: smtpSettings.pass || '' } : undefined
    });

    await transporter.sendMail({
      from: smtpSettings.user || 'no-reply@mesob-helpdesk',
      to,
      subject: 'Mesob Help Desk - Test Email',
      text: 'This is a test email to verify SMTP settings.'
    });

    await logAudit({
      action: 'SETTINGS_TEST_EMAIL',
      req,
      metadata: { testEmail: to }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
};

exports.rotateKeys = async (req, res) => {
  try {
    const setting = await GlobalSetting.findOne({ key: 'globalSettings' });
    const current = normalizeGlobalSettings(setting ? setting.value : DEFAULT_GLOBAL_SETTINGS);
    const currentVersion = Number(current.meta?.tokenVersion || 1);
    const updated = {
      ...current,
      meta: {
        ...(current.meta || {}),
        lastKeyRotation: new Date().toISOString(),
        tokenVersion: currentVersion + 1
      }
    };
    await GlobalSetting.findOneAndUpdate(
      { key: 'globalSettings' },
      { value: updated, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await logAudit({
      action: 'ROTATE_KEYS',
      req,
      metadata: {
        lastKeyRotation: updated.meta.lastKeyRotation,
        tokenVersion: updated.meta.tokenVersion
      }
    });
    await refreshSettings();
    res.json({
      success: true,
      lastKeyRotation: updated.meta.lastKeyRotation,
      tokenVersion: updated.meta.tokenVersion
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to rotate keys' });
  }
};

exports.createBackup = async (req, res) => {
  try {
    const setting = await GlobalSetting.findOne({ key: 'globalSettings' });
    const current = normalizeGlobalSettings(setting ? setting.value : DEFAULT_GLOBAL_SETTINGS);
    const updated = {
      ...current,
      backup: {
        ...(current.backup || {}),
        lastBackup: new Date().toISOString()
      }
    };
    await GlobalSetting.findOneAndUpdate(
      { key: 'globalSettings' },
      { value: updated, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await logAudit({
      action: 'BACKUP_CREATE',
      req,
      metadata: { lastBackup: updated.backup.lastBackup }
    });
    await refreshSettings();
    res.json({ success: true, lastBackup: updated.backup.lastBackup });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create backup' });
  }
};

exports.resetGlobalSettings = async (req, res) => {
  try {
    await GlobalSetting.deleteOne({ key: 'globalSettings' });
    await GlobalSetting.deleteOne({ key: 'smtp' });
    await GlobalSetting.findOneAndUpdate(
      { key: 'maintenance' },
      { value: false, updatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await logAudit({
      action: 'SETTINGS_RESET',
      req
    });
    await refreshSettings();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset settings' });
  }
};

exports.getEnvInfo = async (req, res) => {
  try {
    const mask = (val) => (val ? '*'.repeat(32) : '');
    res.json({
      jwtSecret: mask(process.env.JWT_SECRET),
      mongoUri: mask(process.env.MONGODB_URI),
      serverUrl: process.env.CLIENT_URL || '',
      nodeEnv: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch environment info' });
  }
};
