const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

async function listUsers() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        
        if (!mongoUri) {
            console.error('❌ MongoDB URI not found in environment variables');
            console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
            process.exit(1);
        }
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({}).select('name email role companyId isFirstLogin createdAt').sort({ createdAt: -1 });

        console.log('📋 All Users in Database:\n');
        console.log('─'.repeat(100));
        console.log('NAME'.padEnd(25), 'EMAIL'.padEnd(30), 'ROLE'.padEnd(15), 'COMPANY'.padEnd(10), 'FIRST LOGIN');
        console.log('─'.repeat(100));

        users.forEach(user => {
            const firstLogin = user.isFirstLogin === undefined ? 'undefined' : user.isFirstLogin.toString();
            console.log(
                user.name.padEnd(25),
                user.email.padEnd(30),
                user.role.padEnd(15),
                String(user.companyId).padEnd(10),
                firstLogin
            );
        });

        console.log('─'.repeat(100));
        console.log(`\nTotal Users: ${users.length}\n`);

        // Find recently created Team Leads
        const teamLeads = users.filter(u => u.role === 'Team Lead');
        if (teamLeads.length > 0) {
            console.log('👥 Team Lead Users:');
            teamLeads.forEach(tl => {
                console.log(`   - ${tl.email} (${tl.name}) - isFirstLogin: ${tl.isFirstLogin}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listUsers();
