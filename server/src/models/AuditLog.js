const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'IMPERSONATE',
            'LOGIN',
            'LOGOUT',
            'PASSWORD_CHANGE',
            'PROFILE_UPDATE',
            'ROLE_CHANGE',
            'USER_CREATE',
            'USER_DELETE',
            'DELETE_USER',
            'USER_ROLE_CHANGE',
            'USER_AVAILABILITY',
            'TICKET_CREATE',
            'TICKET_UPDATE',
            'TICKET_ASSIGN',
            'TICKET_COMMENT',
            'TICKET_WORKLOG',
            'TICKET_RATE',
            'TICKET_REVIEW',
            'TICKET_RESOLVE',
            'SETTINGS_UPDATE',
            'SETTINGS_RESET',
            'MAINTENANCE_UPDATE',
            'SMTP_UPDATE',
            'BROADCAST_SEND',
            'BACKUP_CREATE',
            'ROTATE_KEYS'
            ,
            'REQUEST'
        ]
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for performance
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
