const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const superAdmin = {
    name: 'Mesob Super Commander',
    email: 'admin@mesob.com',
    password: 'admin123',
    department: 'Super Administration',
    role: 'Super Admin',
    companyId: 1, // EEU (HQ)
    isAvailable: true
};

async function seedSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Check if exists
        const exists = await User.findOne({ email: superAdmin.email });
        if (exists) {
            console.log('⚠ Super Admin already exists.');

            // Force update role just in case
            exists.role = 'Super Admin';
            await exists.save();
            console.log('✓ Updated role to Super Admin');
            process.exit(0);
        }

        // Create new
        const user = await User.create(superAdmin);
        console.log(`✅ Super Admin created: ${user.email}`);
        console.log(`🔑 Password: ${superAdmin.password}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding Super Admin:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
