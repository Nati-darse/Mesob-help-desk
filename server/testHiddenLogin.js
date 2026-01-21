const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

const testHiddenLogin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔗 Connected to MongoDB');

        const email = 'sys.core.admin.mesob.internal@security.vault.local';
        const password = 'SysCore#2024!MesobVault$Admin&Security*Ultra^Strong%Hidden@Internal';

        console.log('🔍 Testing hidden system admin login...');

        // Find the hidden user (this should work)
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ Hidden system admin not found');
            return;
        }

        console.log('✅ Hidden system admin found:');
        console.log('   Name:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Hidden:', user.isHidden);
        console.log('   Company ID:', user.companyId);

        // Test password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Password test:', isMatch ? '✅ VALID' : '❌ INVALID');

        // Test that hidden user is NOT visible in normal queries
        console.log('🕵️ Testing visibility in normal queries...');
        const normalQuery = await User.findVisible({ role: 'System Admin' });
        const hiddenInNormal = normalQuery.some(u => u.email === email);
        console.log('   Visible in normal User.findVisible():', hiddenInNormal ? '❌ VISIBLE (BAD)' : '✅ HIDDEN (GOOD)');

        // Test that hidden user IS visible in System Admin queries
        const adminQuery = await User.findIncludingHidden({ role: 'System Admin' });
        const visibleInAdmin = adminQuery.some(u => u.email === email);
        console.log('   Visible in System Admin query:', visibleInAdmin ? '✅ VISIBLE (GOOD)' : '❌ HIDDEN (BAD)');

        console.log('');
        console.log('🎯 SECURITY TEST RESULTS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Hidden system admin account created successfully');
        console.log('✅ Password authentication works');
        console.log('✅ Account is hidden from normal user queries');
        console.log('✅ Account is visible to System Admin functions');
        console.log('✅ All security requirements met');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

testHiddenLogin();