const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const sysAdmin = {
    name: 'Mesob Commander',
    email: 'sysadmin@mesob.com',
    password: 'sysadmin123', // Updated to match test credentials
    department: 'Central Intelligence',
    role: 'System Admin',
    companyId: 1, // EEU (HQ)
    isAvailable: true
};

async function seedSysAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Check if exists
        const exists = await User.findOne({ email: sysAdmin.email });
        if (exists) {
            console.log('⚠ System Admin already exists.');

            // Force update role just in case
            exists.role = 'System Admin';
            await exists.save();
            console.log('✓ Updated role to System Admin');
            process.exit(0);
        }

        // Create new
        const user = await User.create(sysAdmin);
        console.log(`✅ System Admin created: ${user.email}`);
        console.log(`🔑 Password: ${sysAdmin.password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding System Admin:', error);
        process.exit(1);
    }
}

seedSysAdmin();
