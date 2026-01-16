const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testLogin() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        console.log(`1. Connecting to MongoDB at ${uri}...`);
        await mongoose.connect(uri);
        console.log('✓ MongoDB Connected');

        console.log('2. Finding User sysadmin@mesob.com...');
        const user = await User.findOne({ email: 'sysadmin@mesob.com' }).select('+password');

        if (!user) {
            console.log('❌ User NOT FOUND');
            return;
        }
        console.log('✓ User found:', user.email);
        console.log('   Role:', user.role);

        console.log('3. Testing Password Match...');
        const isMatch = await user.matchPassword('sysadmin_gold');
        console.log(`✓ Password Match Result: ${isMatch}`);

        if (isMatch) {
            console.log('✅ LOGIN FLOW SUCCESSFUL (Logic is correct)');
        } else {
            console.log('❌ PASSWORD MISMATCH');
        }

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testLogin();
