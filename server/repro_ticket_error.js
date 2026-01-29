const axios = require('axios');

async function testCreateTicket() {
    try {
        // 1. Login as Team Lead
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'lead@mesob.com',
            password: 'lead123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token acquired.');

        // 2. Create Ticket
        console.log('Creating ticket...');
        const ticketData = {
            title: "Test Ticket from Script",
            description: "Testing 500 error",
            category: "Hardware",
            priority: "Medium",
            buildingWing: "Floor: 1",
            companyId: 1
        };

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const res = await axios.post('http://localhost:5000/api/tickets', ticketData, config);
        console.log('Ticket created successfully:', res.data);

    } catch (error) {
        console.error('Error creating ticket:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testCreateTicket();
