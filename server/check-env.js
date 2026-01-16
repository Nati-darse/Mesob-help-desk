require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('JWT')));
