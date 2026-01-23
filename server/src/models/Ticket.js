const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['Software', 'Hardware', 'Network', 'Account', 'Building', 'Other'],
    },
    priority: {
        type: String,
        required: [true, 'Please add a priority'],
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
        default: 'New',
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    department: {
        type: String,
        required: false,
        default: 'General',
    },
    companyId: {
        type: Number,
        required: true,
    },
    buildingWing: {
        type: String,
    },
    attachments: [{
        filename: String,
        path: String,
        mimetype: String,
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    feedback: String,
    workLog: [{
        note: String,
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

ticketSchema.index({ companyId: 1, status: 1, createdAt: -1 });

ticketSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
