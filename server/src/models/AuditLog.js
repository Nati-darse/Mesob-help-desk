const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow null for failed login attempts where user doesn't exist
    },
    userEmail: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
            'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'ROLE_CHANGED',
            'TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_DELETED', 'TICKET_ASSIGNED',
            'COMPANY_CREATED', 'COMPANY_UPDATED', 'COMPANY_SUSPENDED',
            'MAINTENANCE_ENABLED', 'MAINTENANCE_DISABLED',
            'BROADCAST_SENT', 'IMPERSONATION_START', 'IMPERSONATION_END',
            'SETTINGS_UPDATED', 'BULK_ACTION', 'DATA_EXPORT',
            'SESSION_KILLED', 'FORCE_LOGOUT'
        ]
    },
    targetType: {
        type: String,
        enum: ['USER', 'TICKET', 'COMPANY', 'SYSTEM', 'SETTINGS'],
        required: true
    },
    targetId: {
        type: String // Can be ObjectId, companyId, or system identifier
    },
    targetName: {
        type: String // Human readable target name
    },
    details: {
        type: mongoose.Schema.Types.Mixed // Flexible object for action details
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    companyId: {
        type: Number,
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ companyId: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);