const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Migration Script: Update Worker role to Employee
 *
 * This script updates all users with role 'Worker'
 * to 'Employee' to remove the legacy role from the system.
 */

async function migrateWorkerRole() {
    try {
        console.log('Starting Worker -> Employee Role Migration...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected\n');

        const workersToUpdate = await User.find({ role: 'Worker' });

        if (workersToUpdate.length === 0) {
            console.log('No users found with role "Worker"');
            console.log('  Migration not needed or already completed.\n');
            process.exit(0);
        }

        console.log(`Found ${workersToUpdate.length} user(s) with role "Worker":\n`);
        workersToUpdate.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
        });

        console.log('\nUpdating roles to "Employee"...\n');

        const result = await User.updateMany(
            { role: 'Worker' },
            { $set: { role: 'Employee' } }
        );

        console.log('Migration Complete!');
        console.log(`   Updated ${result.modifiedCount} user(s)\n`);

        const verifyEmployees = await User.find({ role: 'Employee' });
        console.log(`Verification: ${verifyEmployees.length} user(s) now have role "Employee"\n`);

        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
}

// Run migration
migrateWorkerRole();
