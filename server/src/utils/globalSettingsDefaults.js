const DEFAULT_GLOBAL_SETTINGS = {
  system: {
    maxFileSize: '10',
    sessionTimeout: '30',
    autoBackup: true,
    debugMode: false,
    rateLimiting: true,
    maxLoginAttempts: '5'
  },
  security: {
    jwtExpiry: '24h',
    passwordMinLength: '8',
    requireTwoFactor: false,
    allowedDomains: ['gov.et', 'mesob.com'],
    ipWhitelist: []
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    digestFrequency: 'daily',
    criticalAlerts: true
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: '30',
    cloudBackup: false,
    lastBackup: null
  },
  meta: {
    lastKeyRotation: null,
    tokenVersion: 1
  }
};

module.exports = { DEFAULT_GLOBAL_SETTINGS };
