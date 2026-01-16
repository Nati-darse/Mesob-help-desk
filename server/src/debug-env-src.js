const dotenv = require('dotenv');
const path = require('path');

console.log('Current directory:', __dirname);
console.log('Env path:', path.join(__dirname, '.env'));

const result = dotenv.config({ path: path.join(__dirname, '.env') });
console.log('Dotenv result:', result);

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
