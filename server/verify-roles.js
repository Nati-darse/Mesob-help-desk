const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Verification Script: Check Role Consistency
 * 
 * This script verifies that all user roles are properly formatted
 * and reports any inconsistencies.
 */

async function verifyRoles() {
    try {
        console.log('🔍 Starting Role Verification...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected\n');

        // Get all users
        const allUsers = await User.find({});
        console.log(`📊 Total Users: ${allUsers.length}\n`);

        // Group by role
        const roleGroups = {};
        allUsers.forEach(user => {
            if (!roleGroups[user.role]) {
                roleGroups[user.role] = [];
            }
            roleGroups[user.role].push(user);
        });

        console.log('📋 Role Distribution:\n');
        Object.keys(roleGroups).sort().forEach(role => {
            const count = roleGroups[role].length;
            const icon = role === 'TECHNICIAN' ? '⚠️ ' : '✓ ';
            console.log(`${icon} ${role}: ${count} user(s)`);
            
            if (role === 'TECHNICIAN') {
                console.log('   ⚠️  WARNING: Found users with old "TECHNICIAN" role (all caps)');
                console.log('   → Run migration script: node migrate-technician-role.js\n');
            }
        });

        // Check for invalid roles
        const validRoles = ['Worker', 'Technician', 'Team Lead', 'Admin', 'System Admin', 'Super Admin'];
        const invalidUsers = allUsers.filter(user => !validRoles.includes(user.role));

        if (invalidUsers.length > 0) {
            console.log('\n❌ Invalid Roles Found:\n');
            invalidUsers.forEach(user => {
                console.log(`   - ${user.name} (${user.email}): "${user.role}"`);
            });
        } else {
            console.log('\n✅ All roles are valid!\n');
        }

        // Detailed breakdown
        console.log('\n📝 Detailed User List:\n');
        console.log('Role'.padEnd(20) + 'Name'.padEnd(25) + 'Email');
        console.log('─'.repeat(70));
        
        allUsers.forEach(user => {
            const roleIcon = user.role === 'TECHNICIAN' ? '⚠️ ' : '';
            console.log(
                `${roleIcon}${user.role}`.padEnd(20) + 
                user.name.padEnd(25) + 
                user.email
            );
        });

        console.log('\n' + '─'.repeat(70));
        console.log('\n✅ Verification Complete!\n');

        // Summary
        const hasTechnicianIssue = roleGroups['TECHNICIAN'] && roleGroups['TECHNICIAN'].length > 0;
        if (hasTechnicianIssue) {
            console.log('⚠️  ACTION REQUIRED:');
            console.log('   Run: node migrate-technician-role.js\n');
        } else {
            console.log('✅ No action required - all roles are properly formatted!\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification Error:', error);
        process.exit(1);
    }
}

// Run verification
verifyRoles();
