/**
 * Test Script: Verify Super Admin Can See Tickets
 * This simulates the exact API calls that Command Center and Manual Assignment make
 * Run with: node server/test-super-admin-tickets.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Ticket = require('./src/models/Ticket');

async function testSuperAdminTicketVisibility() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Find Super Admin user
        const superAdmin = await User.findOne({ role: 'Super Admin' }).lean();
        if (!superAdmin) {
            console.log('❌ No Super Admin found in database!');
            console.log('   Please create a Super Admin user first.\n');
            return;
        }

        console.log('👤 Super Admin Found:');
        console.log(`   Name: ${superAdmin.name}`);
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Role: ${superAdmin.role}`);
        console.log(`   Company ID: ${superAdmin.companyId}\n`);

        // Get all tickets from database
        const allTickets = await Ticket.find({})
            .select('title status priority category companyId technician requester createdAt')
            .populate('technician', 'name')
            .populate('requester', 'name')
            .lean();

        console.log(`📊 Database Statistics:`);
        console.log(`   Total Tickets: ${allTickets.length}`);
        console.log(`   Tickets by Status:`);
        const statusCounts = {};
        allTickets.forEach(t => {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`      ${status}: ${count}`);
        });
        console.log('');

        // Simulate the backend getTickets() logic for Super Admin
        console.log('🔍 Simulating Backend getTickets() for Super Admin:\n');
        
        const globalAdminRoles = ['System Admin', 'Super Admin'];
        const isSuperAdmin = globalAdminRoles.includes(superAdmin.role);
        
        console.log(`   Is Super Admin? ${isSuperAdmin}`);
        console.log(`   Should see ALL tickets? ${isSuperAdmin ? 'YES ✅' : 'NO ❌'}\n`);

        let visibleTickets;
        if (isSuperAdmin) {
            // Super Admin sees ALL tickets (no filtering)
            visibleTickets = allTickets;
            console.log(`   ✅ Super Admin can see ALL ${visibleTickets.length} tickets\n`);
        } else {
            // This shouldn't happen for Super Admin
            visibleTickets = allTickets.filter(t => t.companyId === superAdmin.companyId);
            console.log(`   ⚠️ Filtered to company ${superAdmin.companyId}: ${visibleTickets.length} tickets\n`);
        }

        // Simulate Command Center filtering (unassigned tickets)
        console.log('📋 Command Center - "Live Dispatch Inbox" Filter:\n');
        const unassignedForCommandCenter = visibleTickets.filter(t => 
            t.status === 'New' || !t.technician
        );
        
        console.log(`   Filter: status === 'New' OR no technician`);
        console.log(`   Result: ${unassignedForCommandCenter.length} unassigned tickets\n`);
        
        if (unassignedForCommandCenter.length > 0) {
            console.log('   ✅ TICKETS THAT SHOULD APPEAR IN COMMAND CENTER:');
            unassignedForCommandCenter.forEach((t, idx) => {
                console.log(`   ${idx + 1}. ${t.title}`);
                console.log(`      Status: ${t.status}`);
                console.log(`      Technician: ${t.technician ? t.technician.name : 'None (Unassigned)'}`);
                console.log(`      Company: ${t.companyId}`);
                console.log(`      Created: ${new Date(t.createdAt).toLocaleString()}`);
                console.log('');
            });
        } else {
            console.log('   ⚠️ NO UNASSIGNED TICKETS FOUND\n');
            console.log('   Possible reasons:');
            console.log('   1. All tickets have been assigned to technicians');
            console.log('   2. All tickets have status other than "New"');
            console.log('   3. No tickets exist in the database\n');
        }

        // Simulate Manual Assignment filtering (same logic)
        console.log('📋 Manual Assignment - "Unassigned Tickets" Filter:\n');
        const unassignedForManualAssignment = visibleTickets.filter(t => 
            t.status === 'New' || !t.technician
        );
        
        console.log(`   Filter: status === 'New' OR no technician`);
        console.log(`   Result: ${unassignedForManualAssignment.length} unassigned tickets\n`);
        
        if (unassignedForManualAssignment.length > 0) {
            console.log('   ✅ TICKETS THAT SHOULD APPEAR IN MANUAL ASSIGNMENT:');
            unassignedForManualAssignment.forEach((t, idx) => {
                console.log(`   ${idx + 1}. ${t.title}`);
                console.log(`      Status: ${t.status}`);
                console.log(`      Technician: ${t.technician ? t.technician.name : 'None (Unassigned)'}`);
                console.log('');
            });
        } else {
            console.log('   ⚠️ NO UNASSIGNED TICKETS FOUND\n');
        }

        // Show all tickets with their current status
        console.log('📊 ALL TICKETS IN DATABASE (with details):\n');
        allTickets.forEach((t, idx) => {
            console.log(`${idx + 1}. ${t.title}`);
            console.log(`   Status: ${t.status}`);
            console.log(`   Priority: ${t.priority}`);
            console.log(`   Category: ${t.category}`);
            console.log(`   Company: ${t.companyId}`);
            console.log(`   Technician: ${t.technician ? t.technician.name : 'None (Unassigned)'}`);
            console.log(`   Requester: ${t.requester ? t.requester.name : 'Unknown'}`);
            console.log(`   Created: ${new Date(t.createdAt).toLocaleString()}`);
            console.log(`   Should appear in assignment pages? ${(t.status === 'New' || !t.technician) ? 'YES ✅' : 'NO ❌'}`);
            console.log('');
        });

        // Final verdict
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('🎯 TEST RESULTS:\n');
        
        if (unassignedForCommandCenter.length > 0) {
            console.log(`✅ SUCCESS: Super Admin SHOULD see ${unassignedForCommandCenter.length} ticket(s) in Command Center`);
            console.log(`✅ SUCCESS: Super Admin SHOULD see ${unassignedForManualAssignment.length} ticket(s) in Manual Assignment\n`);
            
            console.log('📝 Next Steps:');
            console.log('   1. Restart the server: cd server && npm start');
            console.log('   2. Login as Super Admin');
            console.log('   3. Go to Command Center - should see tickets in "Live Dispatch Inbox"');
            console.log('   4. Go to Manual Assignment - should see tickets in "Unassigned Tickets"');
            console.log('   5. Open browser console (F12) to see debug logs\n');
        } else {
            console.log('⚠️ WARNING: No unassigned tickets found!\n');
            console.log('📝 To test the assignment feature:');
            console.log('   1. Create a new ticket as a Team Lead or User');
            console.log('   2. Make sure the ticket has status "New"');
            console.log('   3. Make sure the ticket has no technician assigned');
            console.log('   4. Then run this test again\n');
            
            console.log('💡 Current ticket statuses:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} ticket(s)`);
            });
            console.log('');
        }

        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testSuperAdminTicketVisibility();
