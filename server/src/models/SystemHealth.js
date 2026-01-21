const mongoose = require('mongoose');

const systemHealthSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        expires: 86400 // Auto-delete after 24 hours
    },
    services: {
        mongodb: {
            status: { type: String, enum: ['online', 'offline', 'degraded'], default: 'online' },
            responseTime: Number,
            connections: Number,
            details: String
        },
        redis: {
            status: { type: String, enum: ['online', 'offline', 'degraded'], default: 'offline' },
            responseTime: Number,
            memoryUsage: Number,
            details: String
        },
        socketio: {
            status: { type: String, enum: ['online', 'offline', 'degraded'], default: 'online' },
            activeConnections: Number,
            totalConnections: Number,
            details: String
        },
        smtp: {
            status: { type: String, enum: ['online', 'offline', 'degraded'], default: 'online' },
            lastTestAt: Date,
            details: String
        },
        api: {
            status: { type: String, enum: ['online', 'offline', 'degraded'], default: 'online' },
            responseTime: Number,
            requestsPerMinute: Number,
            errorRate: Number,
            details: String
        }
    },
    systemMetrics: {
        cpuUsage: Number,
        memoryUsage: Number,
        diskUsage: Number,
        uptime: Number
    }
});

module.exports = mongoose.model('SystemHealth', systemHealthSchema);