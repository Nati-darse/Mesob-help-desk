const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

async function fixAdminFirstLogin() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Find all System Admin and Super Admin users
        const adminUsers = await User.find({
            role: { $in: ['System Admin', 'Super Admin'] }
        });

        console.log(`Found ${adminUsers.length} admin users:\n`);

        for (const user of adminUsers) {
            console.log(`📝 ${user.name} (${user.email}) - ${user.role}`);
            console.log(`   Current isFirstLogin: ${user.isFirstLogin}`);
            
            // Set isFirstLogin to false for existing admins
            user.isFirstLogin = false;
            await user.save();
            
            console.log(`   ✅ Updated to: ${user.isFirstLogin}\n`);
        }

        console.log('═'.repeat(60));
        console.log('✅ All admin accounts updated successfully!');
        console.log('═'.repeat(60));
        console.log('\n💡 System Admin and Super Admin will no longer see');
        console.log('   the password change dialog on login.\n');
        console.log('🔐 Only newly created users will be required to');
        console.log('   change their password on first login.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAdminFirstLogin();
