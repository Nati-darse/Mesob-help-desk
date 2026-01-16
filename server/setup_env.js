const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

const envContent = `
PORT=5000
MONGODB_URI=mongodb://localhost:27017/helpdesk_db
JWT_SECRET=mesob_secret_key_2026_secure
JWT_REFRESH_SECRET=mesob_refresh_secret_key_2026_secure
CLIENT_URL=http://localhost:5173
EMAIL_SERVICE=gmail
EMAIL_USER=mesobithelpdesk@gmail.com
EMAIL_PASS=your_app_password
`;

fs.writeFileSync(envPath, envContent.trim());
console.log('✅ .env file has been force-updated with fresh secrets.');
