const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['info', 'warning', 'error'],
        default: 'info'
    },
    targetType: {
        type: String,
        enum: ['all', 'company', 'role', 'specific'], // specific = user
        default: 'all'
    },
    targetValue: {
        type: String // companyId, role name, or userId
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 7 // Auto-delete after 7 days
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
