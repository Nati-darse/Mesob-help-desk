const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Migration Script: Update TECHNICIAN role to Technician
 * 
 * This script updates all users with role 'TECHNICIAN' (all caps) 
 * to 'Technician' (proper case) to fix role consistency issues.
 */

async function migrateTechnicianRole() {
    try {
        console.log('🔄 Starting Technician Role Migration...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ MongoDB Connected\n');

        // Find all users with TECHNICIAN role (all caps)
        const techsToUpdate = await User.find({ role: 'TECHNICIAN' });
        
        if (techsToUpdate.length === 0) {
            console.log('✓ No users found with role "TECHNICIAN" (all caps)');
            console.log('  Migration not needed or already completed.\n');
            process.exit(0);
        }

        console.log(`📋 Found ${techsToUpdate.length} user(s) with role "TECHNICIAN":\n`);
        
        techsToUpdate.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
        });

        console.log('\n🔧 Updating roles to "Technician"...\n');

        // Update all TECHNICIAN roles to Technician
        const result = await User.updateMany(
            { role: 'TECHNICIAN' },
            { $set: { role: 'Technician' } }
        );

        console.log(`✅ Migration Complete!`);
        console.log(`   Updated ${result.modifiedCount} user(s)\n`);

        // Verify the update
        const verifyTechs = await User.find({ role: 'Technician' });
        console.log(`✓ Verification: ${verifyTechs.length} user(s) now have role "Technician"\n`);

        verifyTechs.forEach(user => {
            console.log(`  ✓ ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        console.log('\n🎉 Migration successful!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
}

// Run migration
migrateTechnicianRole();
