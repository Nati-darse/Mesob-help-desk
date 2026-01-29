const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function fixTeamLeadPassword() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find the team lead user (adjust email if needed)
        const email = process.argv[2] || 'teamlead@example.com'; // Pass email as argument
        
        console.log(`\n🔍 Looking for user: ${email}`);
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('❌ User not found!');
            console.log('\n📋 Available users:');
            const allUsers = await User.find({}).select('name email role');
            allUsers.forEach(u => {
                console.log(`   - ${u.email} (${u.role})`);
            });
            process.exit(1);
        }

        console.log(`\n✅ Found user: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Company ID: ${user.companyId}`);
        console.log(`   isFirstLogin: ${user.isFirstLogin}`);

        // Set the default password
        const defaultPassword = 'Mesob@123';
        
        // Hash the password manually (since pre-save hook will hash it again)
        user.password = defaultPassword; // Will be hashed by pre-save hook
        user.isFirstLogin = true;
        
        await user.save();

        console.log(`\n✅ Password reset successfully!`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${defaultPassword}`);
        console.log(`   isFirstLogin: ${user.isFirstLogin}`);
        console.log(`\n🔐 You can now login with these credentials.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
fixTeamLeadPassword();
