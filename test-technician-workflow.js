const axios = require('axios');

// Test the technician workflow endpoints
async function testTechnicianWorkflow() {
    const baseURL = 'http://localhost:5000/api';
    
    // You'll need to replace this with a valid technician token
    const technicianToken = 'your-technician-token-here';
    
    const headers = {
        'Authorization': `Bearer ${technicianToken}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('=== Testing Technician Workflow Endpoints ===\n');

        // 1. Test getting assigned tickets
        console.log('1. Testing GET /api/technician/assigned');
        const ticketsResponse = await axios.get(`${baseURL}/technician/assigned`, { headers });
        console.log(`✓ Found ${ticketsResponse.data.length} assigned tickets\n`);

        if (ticketsResponse.data.length > 0) {
            const testTicket = ticketsResponse.data[0];
            console.log(`Using ticket ID: ${testTicket._id} for testing\n`);

            // 2. Test accept and start endpoint
            console.log('2. Testing PUT /api/technician/:id/accept-and-start');
            try {
                const acceptStartResponse = await axios.put(
                    `${baseURL}/technician/${testTicket._id}/accept-and-start`,
                    { initialNote: 'Starting work on this ticket - initial assessment complete' },
                    { headers }
                );
                console.log('✓ Accept and start endpoint working');
                console.log(`Response: ${acceptStartResponse.data.message}\n`);
            } catch (error) {
                console.log(`⚠ Accept and start test: ${error.response?.data?.message || error.message}\n`);
            }

            // 3. Test finish and request feedback endpoint
            console.log('3. Testing PUT /api/technician/:id/finish-and-request-feedback');
            try {
                const finishResponse = await axios.put(
                    `${baseURL}/technician/${testTicket._id}/finish-and-request-feedback`,
                    { completionNote: 'Work completed successfully - issue resolved' },
                    { headers }
                );
                console.log('✓ Finish and request feedback endpoint working');
                console.log(`Response: ${finishResponse.data.message}\n`);
            } catch (error) {
                console.log(`⚠ Finish and request feedback test: ${error.response?.data?.message || error.message}\n`);
            }
        }

        console.log('=== Test Complete ===');
    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testTechnicianWorkflow();