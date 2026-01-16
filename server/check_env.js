require('dotenv').config();
console.log('Checking Environment Variables...');
console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
if (!process.env.JWT_SECRET) console.error('BIG ERROR: JWT_SECRET IS MISSING!');
