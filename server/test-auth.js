const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Authentication Test Script
 * 
 * Tests login functionality for all roles
 */

const testCredentials = [
    { email: 'sysadmin@mesob.com', password: 'sysadmin123', expectedRole: 'System Admin' },
    { email: 'admin@mesob.com', password: 'admin123', expectedRole: 'Super Admin' },
    { email: 'tech@mesob.com', password: 'tech123', expectedRole: 'Technician' },
    { email: 'solomon@mesob.com', password: 'tech123', expectedRole: 'Technician' },
    { email: 'lead@mesob.com', password: 'lead123', expectedRole: 'Team Lead' },
    { email: 'ermias@eeu.com', password: 'emp123', expectedRole: 'Employee' },
];

async function testAuthentication() {
    try {
        console.log('🧪 Starting Authentication Tests...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected\n');

        let passed = 0;
        let failed = 0;

        for (const cred of testCredentials) {
            process.stdout.write(`Testing ${cred.email}... `);
            
            try {
                // Find user
                const user = await User.findOne({ email: cred.email }).select('+password');
                
                if (!user) {
                    console.log('❌ FAILED - User not found');
                    failed++;
                    continue;
                }

                // Check role
                if (user.role !== cred.expectedRole) {
                    console.log(`❌ FAILED - Expected role "${cred.expectedRole}", got "${user.role}"`);
                    failed++;
                    continue;
                }

                // Test password
                const isMatch = await user.matchPassword(cred.password);
                
                if (!isMatch) {
                    console.log('❌ FAILED - Password mismatch');
                    failed++;
                    continue;
                }

                console.log(`✅ PASSED (${user.role})`);
                passed++;
                
            } catch (error) {
                console.log(`❌ FAILED - ${error.message}`);
                failed++;
            }
        }

        console.log('\n' + '─'.repeat(50));
        console.log(`\n📊 Test Results:`);
        console.log(`   ✅ Passed: ${passed}/${testCredentials.length}`);
        console.log(`   ❌ Failed: ${failed}/${testCredentials.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 All authentication tests passed!\n');
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above.\n');
        }

        process.exit(failed === 0 ? 0 : 1);
    } catch (error) {
        console.error('❌ Test Error:', error);
        process.exit(1);
    }
}

// Run tests
testAuthentication();
