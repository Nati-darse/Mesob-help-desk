const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Software', 'Hardware', 'Network', 'Account', 'Building', 'Other'],
        default: 'Other',
    },
    priority: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
    },
    status: {
        type: String,
        required: true,
        enum: ['New', 'Assigned', 'In Progress', 'Resolved', 'Pending Feedback', 'Closed'],
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
        required: true,
    },
    companyId: {
        type: Number,
        required: true,
    },
    comments: [
        {
            text: String,
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    feedback: {
        type: String,
    },
    workLog: [
        {
            technician: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            action: String,
            timestamp: {
                type: Date,
                default: Date.now,
            },
            details: String,
            duration: Number, // In minutes
        },
    ],
    buildingWing: {
        type: String,
    },
    reviewStatus: {
        type: String,
        enum: ['None', 'Pending', 'Approved', 'Rejected'],
        default: 'None',
    },
    reviewNotes: {
        type: String,
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: {
        type: Date,
    }
}, {
    timestamps: true
});

// Index for performance
ticketSchema.index({ companyId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
