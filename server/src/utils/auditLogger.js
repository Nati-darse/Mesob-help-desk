const AuditLog = require('../models/AuditLog');

const logAudit = async ({ action, req, targetUser, metadata }) => {
  try {
    if (!req || !req.user) return;
    const userAgent = req.get ? req.get('User-Agent') : req.headers?.['user-agent'];
    await AuditLog.create({
      action,
      performedBy: req.user._id,
      targetUser: targetUser || undefined,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent,
      metadata: {
        companyId: req.user.companyId,
        ...(metadata || {})
      }
    });
  } catch (error) {
    // Avoid breaking main flow if audit fails
    console.error('[AuditLog] Failed to record:', error.message);
  }
};

module.exports = { logAudit };
