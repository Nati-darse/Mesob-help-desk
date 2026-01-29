/**
 * Test script to verify ticket visibility for admins
 * Run with: node server/test-ticket-visibility.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const Ticket = require('./server/src/models/Ticket');
const User = require('./server/src/models/User');

async function testTicketVisibility() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get all tickets
        const allTickets = await Ticket.find({}).select('title status companyId technician createdAt').lean();
        console.log(`📊 Total Tickets in Database: ${allTickets.length}\n`);

        // Get New tickets
        const newTickets = allTickets.filter(t => t.status === 'New');
        console.log(`🆕 Tickets with status 'New': ${newTickets.length}`);
        newTickets.forEach(t => {
            console.log(`   - ${t.title} (Company: ${t.companyId}, Created: ${new Date(t.createdAt).toLocaleString()})`);
        });

        // Get unassigned tickets
        const unassignedTickets = allTickets.filter(t => !t.technician);
        console.log(`\n📋 Unassigned Tickets (no technician): ${unassignedTickets.length}`);
        unassignedTickets.forEach(t => {
            console.log(`   - ${t.title} (Status: ${t.status}, Company: ${t.companyId})`);
        });

        // Get tickets that should show in assignment pages
        const assignableTickets = allTickets.filter(t => t.status === 'New' || !t.technician);
        console.log(`\n✅ Tickets that SHOULD show in assignment pages: ${assignableTickets.length}`);
        assignableTickets.forEach(t => {
            console.log(`   - ${t.title} (Status: ${t.status}, Company: ${t.companyId}, Technician: ${t.technician ? 'Assigned' : 'None'})`);
        });

        // Get admin users
        const admins = await User.find({ role: { $in: ['Admin', 'Super Admin', 'System Admin'] } })
            .select('name email role companyId').lean();
        console.log(`\n👥 Admin Users: ${admins.length}`);
        admins.forEach(admin => {
            console.log(`   - ${admin.name} (${admin.role}, Company: ${admin.companyId})`);
        });

        // Test visibility for each admin
        console.log(`\n🔍 Testing Ticket Visibility by Admin:\n`);
        for (const admin of admins) {
            let visibleTickets;
            
            if (['System Admin', 'Super Admin'].includes(admin.role)) {
                // Should see ALL tickets
                visibleTickets = assignableTickets;
            } else if (admin.role === 'Admin') {
                // Should see tickets from their company
                if (admin.companyId === 20) {
                    // Mesob admin sees all
                    visibleTickets = assignableTickets;
                } else {
                    // Non-Mesob admin sees only their company
                    visibleTickets = assignableTickets.filter(t => t.companyId === admin.companyId);
                }
            }

            console.log(`${admin.name} (${admin.role}, Company ${admin.companyId}):`);
            console.log(`   Should see: ${visibleTickets.length} tickets`);
            if (visibleTickets.length > 0) {
                visibleTickets.forEach(t => {
                    console.log(`      - ${t.title} (Company: ${t.companyId})`);
                });
            }
            console.log('');
        }

        console.log('\n✅ Test Complete!');
        console.log('\n💡 If admins are not seeing tickets in the UI:');
        console.log('   1. Make sure the SERVER has been RESTARTED after the code fix');
        console.log('   2. Check browser console for API errors');
        console.log('   3. Verify the admin is logged in with the correct role');
        console.log('   4. Try refreshing the page or clearing browser cache\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testTicketVisibility();
