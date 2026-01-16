const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const testUsers = [
    // Super Admin
    {
        name: 'Mesob Super Commander',
        email: 'admin@mesob.com',
        password: 'admin123',
        department: 'Super Administration',
        role: 'Super Admin',
        companyId: 1,
        isAvailable: true
    },
    // System Admin
    {
        name: 'Mesob Commander',
        email: 'sysadmin@mesob.com',
        password: 'sysadmin123',
        department: 'Central Intelligence',
        role: 'System Admin',
        companyId: 1,
        isAvailable: true
    },
    // Technicians
    {
        name: 'Ermias Tech',
        email: 'tech@mesob.com',
        password: 'tech123',
        department: 'IT Support',
        role: 'Technician',
        companyId: 1,
        isAvailable: true
    },
    {
        name: 'Solomon Tech',
        email: 'solomon@mesob.com',
        password: 'tech123',
        department: 'IT Support',
        role: 'Technician',
        companyId: 2,
        isAvailable: true
    },
    // Employees from different bureaus
    {
        name: 'Ermias Employee',
        email: 'ermias@eeu.com',
        password: 'emp123',
        department: 'Operations',
        role: 'Worker',
        companyId: 1, // Ethiopian Electric Utility Services
        isAvailable: false
    },
    {
        name: 'Abebe Bekele',
        email: 'abebe@cbe.com',
        password: 'emp123',
        department: 'Finance',
        role: 'Worker',
        companyId: 2, // Commercial Bank of Ethiopia
        isAvailable: false
    },
    {
        name: 'Sara Tadesse',
        email: 'sara@ethiotelecom.com',
        password: 'emp123',
        department: 'Marketing',
        role: 'Worker',
        companyId: 3, // Ethio Telecom
        isAvailable: false
    },
    {
        name: 'Daniel Assefa',
        email: 'daniel@aacaa.gov.et',
        password: 'emp123',
        department: 'Operations',
        role: 'Worker',
        companyId: 4, // AACAA
        isAvailable: false
    },
    // Team Lead
    {
        name: 'Ermias Lead',
        email: 'lead@mesob.com',
        password: 'lead123',
        department: 'IT Support',
        role: 'Team Lead',
        companyId: 1,
        isAvailable: true
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create test users
        for (const userData of testUsers) {
            const user = await User.create(userData);
            console.log(`✓ Created: ${user.name} (${user.email}) - Role: ${user.role} - Company ID: ${user.companyId}`);
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Test Accounts:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Super Admin: admin@mesob.com / admin123');
        console.log('System Admin: sysadmin@mesob.com / sysadmin123');
        console.log('Technician: tech@mesob.com / tech123');
        console.log('Technician: solomon@mesob.com / tech123');
        console.log('Team Lead: lead@mesob.com / lead123');
        console.log('Employee:   ermias@eeu.com / emp123');
        console.log('Employee:   abebe@cbe.com / emp123');
        console.log('Employee:   sara@ethiotelecom.com / emp123');
        console.log('Employee:   daniel@aacaa.gov.et / emp123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
