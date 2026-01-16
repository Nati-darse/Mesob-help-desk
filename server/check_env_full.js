require('dotenv').config();
console.log('Checking Environment Variables...');
console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET present:', !!process.env.JWT_REFRESH_SECRET);

if (!process.env.JWT_REFRESH_SECRET) {
    console.error('❌ FATAL: JWT_REFRESH_SECRET IS MISSING!');
} else {
    console.log('✅ All secrets present.');
}
