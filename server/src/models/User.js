const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['Worker', 'Technician', 'TECHNICIAN', 'Team Lead', 'Admin', 'System Admin', 'Super Admin'],
        default: 'Worker',
    },
    department: {
        type: String,
        required: [true, 'Please add a department'],
    },
    companyId: {
        type: Number,
        required: [true, 'Please add a company ID'],
        default: 1,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    // Technician Duty Status
    dutyStatus: {
        type: String,
        enum: ['Online', 'On-Site', 'Break', 'Offline'],
        default: 'Online',
    },
    dutyStatusUpdatedAt: {
        type: Date,
        default: Date.now,
    },
    // Enhanced audit fields
    lastLoginAt: {
        type: Date,
    },
    lastLoginIP: {
        type: String,
    },
    sessionToken: {
        type: String,
        select: false,
    },
    isHidden: {
        type: Boolean,
        default: false, // System Admins are hidden from tenant views
    },
    loginHistory: [{
        loginAt: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
        success: { type: Boolean, default: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Update login tracking
userSchema.methods.updateLoginInfo = async function(ipAddress, userAgent) {
    try {
        this.lastLoginAt = new Date();
        this.lastLoginIP = ipAddress;
        
        // Add to login history (keep last 10 entries)
        if (!this.loginHistory) {
            this.loginHistory = [];
        }
        
        this.loginHistory.unshift({
            loginAt: new Date(),
            ipAddress,
            userAgent,
            success: true
        });
        
        if (this.loginHistory.length > 10) {
            this.loginHistory = this.loginHistory.slice(0, 10);
        }
        
        // Use save with validation disabled for login tracking to avoid hanging
        return await this.save({ validateBeforeSave: false });
    } catch (error) {
        console.error('Error in updateLoginInfo:', error);
        // If save fails, just update the fields without saving login history
        this.lastLoginAt = new Date();
        this.lastLoginIP = ipAddress;
        return Promise.resolve();
    }
};

// Static method to find all users including hidden ones (System Admin only)
userSchema.statics.findIncludingHidden = function(query = {}) {
    return this.find(query);
};

// Static method to find only hidden users (System Admin only)  
userSchema.statics.findHiddenOnly = function(query = {}) {
    return this.find({ ...query, isHidden: true });
};

// Static method to find only visible users (normal queries) - DEFAULT FOR REGULAR USE
userSchema.statics.findVisible = function(query = {}) {
    return this.find({ ...query, isHidden: { $ne: true } });
};

module.exports = mongoose.model('User', userSchema);
