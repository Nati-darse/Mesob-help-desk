const mongoose = require('mongoose');
const Ticket = require('./src/models/Ticket');
const User = require('./src/models/User');
require('dotenv').config();

const sampleTickets = [
    // EEU Tickets
    {
        title: 'Server Room AC Failure',
        description: 'Main server room air conditioning unit stopped working. Temp rising rapidly.',
        category: 'Hardware',
        priority: 'Critical',
        status: 'New',
        companyId: 1,
        buildingWing: 'Building A - Floor 3 - Server Room',
        department: 'IT Operations'
    },
    {
        title: 'Email System Down',
        description: 'Unable to send or receive emails since this morning.',
        category: 'Network',
        priority: 'High',
        status: 'New',
        companyId: 1,
        buildingWing: 'Building B - Floor 2',
        department: 'Communications'
    },
    {
        title: 'Printer Offline',
        description: 'HP LaserJet printer not responding. Tried restarting.',
        category: 'Hardware',
        priority: 'Low',
        status: 'New',
        companyId: 1,
        buildingWing: 'Building A - Floor 1',
        department: 'Admin'
    },
    // CBE Tickets
    {
        title: 'Core Banking System Slow',
        description: 'Transaction processing taking 5x longer than usual.',
        category: 'Software',
        priority: 'Critical',
        status: 'New',
        companyId: 2,
        buildingWing: 'Main Branch - Floor 1',
        department: 'Banking Operations'
    },
    {
        title: 'ATM Network Connectivity',
        description: '3 ATMs offline in downtown area.',
        category: 'Network',
        priority: 'High',
        status: 'New',
        companyId: 2,
        buildingWing: 'Regional Hub',
        department: 'ATM Operations'
    },
    {
        title: 'Workstation Monitor Flickering',
        description: 'Employee monitor flickering. Productivity affected.',
        category: 'Hardware',
        priority: 'Medium',
        status: 'New',
        companyId: 2,
        buildingWing: 'HQ - Floor 5 - Desk 23',
        department: 'Finance'
    },
    // Ethio Telecom Tickets
    {
        title: 'Call Center System Crash',
        description: 'Customer service phone system crashed. 200+ agents offline.',
        category: 'Software',
        priority: 'Critical',
        status: 'New',
        companyId: 3,
        buildingWing: 'Call Center - Building C',
        department: 'Customer Service'
    },
    {
        title: 'Billing Portal Login Issues',
        description: 'Customers reporting unable to login to pay bills online.',
        category: 'Software',
        priority: 'High',
        status: 'New',
        companyId: 3,
        buildingWing: 'Data Center',
        department: 'IT Services'
    },
    // AACAA Tickets
    {
        title: 'Flight Information Display Malfunction',
        description: 'Departure boards showing incorrect flight times.',
        category: 'Software',
        priority: 'Critical',
        status: 'New',
        companyId: 4,
        buildingWing: 'Terminal 2 - Departures',
        department: 'IT Operations'
    },
    {
        title: 'Security Camera Offline',
        description: 'Camera 12 in parking lot not recording.',
        category: 'Hardware',
        priority: 'Medium',
        status: 'New',
        companyId: 4,
        buildingWing: 'Parking Area B',
        department: 'Security'
    },
    // More critical tickets for testing "Critical" badges
    {
        title: 'Water Infrastructure Network Down',
        description: 'SCADA system offline. Cannot monitor water treatment.',
        category: 'Network',
        priority: 'Critical',
        status: 'New',
        companyId: 5, // Addis Ababa Water & Sewerage Authority
        buildingWing: 'Control Center',
        department: 'Operations'
    },
    {
        title: 'Payroll System Error',
        description: 'Salary calculations incorrect for 500+ employees.',
        category: 'Software',
        priority: 'Critical',
        status: 'New',
        companyId: 5,
        buildingWing: 'HQ - Floor 2',
        department: 'HR'
    },
    {
        title: 'Database Connection Timeout',
        description: 'Main database intermittently unreachable.',
        category: 'Software',
        priority: 'High',
        status: 'New',
        companyId: 5,
        buildingWing: 'Data Center',
        department: 'IT'
    },
    {
        title: 'VPN Access Denied',
        description: 'Remote workers cannot connect to VPN.',
        category: 'Network',
        priority: 'High',
        status: 'New',
        companyId: 5,
        buildingWing: 'Network Operations',
        department: 'IT Support'
    },
    {
        title: 'Laptop Battery Not Charging',
        description: 'Dell laptop battery shows plugged in but not charging.',
        category: 'Hardware',
        priority: 'Low',
        status: 'New',
        companyId: 5,
        buildingWing: 'Floor 3 - Room 305',
        department: 'Engineering'
    },
    {
        title: 'Software License Expired',
        description: 'Microsoft Office licenses expired for 50 machines.',
        category: 'Software',
        priority: 'Medium',
        status: 'New',
        companyId: 5,
        buildingWing: 'Building D - All Floors',
        department: 'IT Procurement'
    }
];

async function seedTickets() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Get a user to be the requester (use the first employee)
        const requester = await User.findOne({ role: 'Worker' });
        if (!requester) {
            console.log('⚠ No employee users found. Please run the user seeder first.');
            process.exit(1);
        }

        // Add requester to all tickets
        const ticketsWithRequester = sampleTickets.map(ticket => ({
            ...ticket,
            requester: requester._id
        }));

        // Create tickets
        await Ticket.insertMany(ticketsWithRequester);

        console.log('✅ Sample tickets created successfully!');
        console.log('\n📊 Ticket Summary:');
        console.log(`   Total Tickets: ${sampleTickets.length}`);
        console.log(`   Critical: ${sampleTickets.filter(t => t.priority === 'Critical').length}`);
        console.log(`   High: ${sampleTickets.filter(t => t.priority === 'High').length}`);
        console.log(`   Medium: ${sampleTickets.filter(t => t.priority === 'Medium').length}`);
        console.log(`   Low: ${sampleTickets.filter(t => t.priority === 'Low').length}`);
        console.log('\n🏢 Companies with >5 tickets (Critical Status):');
        const companyTickets = {};
        sampleTickets.forEach(t => {
            companyTickets[t.companyId] = (companyTickets[t.companyId] || 0) + 1;
        });
        Object.entries(companyTickets).forEach(([id, count]) => {
            if (count > 5) console.log(`   Company ${id}: ${count} tickets ⚠️`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding tickets:', error);
        process.exit(1);
    }
}

seedTickets();
