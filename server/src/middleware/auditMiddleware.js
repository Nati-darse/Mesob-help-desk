const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = new Set(['password', 'pass', 'token', 'refreshToken']);

const sanitize = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitize);
  const output = {};
  Object.keys(value).forEach((key) => {
    if (SENSITIVE_KEYS.has(key)) return;
    output[key] = sanitize(value[key]);
  });
  return output;
};

const auditMiddleware = (req, res, next) => {
  if (!req.user) return next();
  if (req.method === 'OPTIONS') return next();

  res.on('finish', async () => {
    try {
      await AuditLog.create({
        action: 'REQUEST',
        performedBy: req.user._id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          companyId: req.user.companyId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          query: sanitize(req.query),
          body: sanitize(req.body)
        }
      });
    } catch (error) {
      console.error('[AuditLog] Request logging failed:', error.message);
    }
  });

  next();
};

module.exports = auditMiddleware;
