const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

async function resetPassword() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get email from command line argument
        const email = process.argv[2];
        
        if (!email) {
            console.log('❌ Please provide an email address');
            console.log('\nUsage: node reset-password.js <email>');
            console.log('\nExample: node reset-password.js selam@mesob.com');
            console.log('\n📋 Available Team Lead users:');
            const teamLeads = await User.find({ role: 'Team Lead' }).select('name email');
            teamLeads.forEach(tl => console.log(`   - ${tl.email} (${tl.name})`));
            process.exit(1);
        }

        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log(`❌ User not found: ${email}\n`);
            console.log('📋 Available users:');
            const allUsers = await User.find({}).select('name email role');
            allUsers.forEach(u => console.log(`   - ${u.email} (${u.name}) - ${u.role}`));
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Company ID: ${user.companyId}\n`);

        // Reset password to default
        const defaultPassword = 'Mesob@123';
        user.password = defaultPassword; // Will be hashed by pre-save hook
        user.isFirstLogin = true;
        
        await user.save();

        console.log('✅ Password reset successfully!\n');
        console.log('═'.repeat(50));
        console.log('  LOGIN CREDENTIALS');
        console.log('═'.repeat(50));
        console.log(`  Email:    ${user.email}`);
        console.log(`  Password: ${defaultPassword}`);
        console.log('═'.repeat(50));
        console.log('\n🔐 You can now login with these credentials.');
        console.log('💡 You will be asked to change your password on first login.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetPassword();
