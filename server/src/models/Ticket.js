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
        enum: ['New', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Pending Feedback', 'Resolved', 'Closed'],
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
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    department: {
        type: String,
        required: true,
    },
    companyId: {
        type: Number,
        required: true,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    location: {
        type: String,
    },
    // KPI Tracking Fields
    assignedAt: {
        type: Date,
    },
    acceptedAt: {
        type: Date,
    },
    startedAt: {
        type: Date,
    },
    finishedAt: {
        type: Date,
    },
    resolvedAt: {
        type: Date,
    },
    feedbackRequestedAt: {
        type: Date,
    },
    feedbackRequestedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Team leader who created the ticket
    },
    // Resolution Details
    resolutionCategory: {
        type: String,
        enum: ['Hardware', 'Software', 'Network', 'User Error', 'Other'],
    },
    resolutionCode: {
        type: String,
        enum: ['FIXED', 'REPLACED', 'WORKAROUND', 'ESCALATED', 'DUPLICATE'],
    },
    rootCause: {
        type: String,
    },
    actionTaken: {
        type: String,
    },
    timeSpent: {
        type: Number, // in hours
    },
    partsUsed: {
        type: String,
    },
    nextSteps: {
        type: String,
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Internal IT Notes with character limit
    internalNotes: {
        type: String,
        maxlength: 500, // 500 character limit
    },
    // Technician work notes for future reference
    technicianNotes: [{
        note: {
            type: String,
            maxlength: 500,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    // Customer Updates
    updates: [{
        message: String,
        type: { type: String, enum: ['customer', 'internal'], default: 'customer' },
        timestamp: { type: Date, default: Date.now },
        user: String
    }],
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

module.exports = mongoose.model('Ticket', ticketSchema);
