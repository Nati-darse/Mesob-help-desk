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
        enum: ['Worker', 'Technician', 'Team Lead', 'Admin', 'System Admin', 'Super Admin'],
        default: 'Worker',
    },
    department: {
        type: String,
        required: false,
        default: '',
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
    dutyStatus: {
        type: String,
        enum: ['Online', 'On-Site', 'Break', 'Offline'],
        default: 'Online',
    },
    phone: {
        type: String,
        default: '',
    },
    profilePic: {
        type: String,
        default: '',
    },
    isFirstLogin: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Combined pre-save hook for password and status sync
// Modern async/await style without next() for Mongoose 6+
userSchema.pre('save', async function () {
    // Hashing password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Syncing isAvailable with dutyStatus
    if (this.isModified('dutyStatus')) {
        this.isAvailable = (this.dutyStatus === 'Online');
    }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
