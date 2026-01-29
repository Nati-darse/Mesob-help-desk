const express = require('express');
const router = express.Router();
const { register, login, getMe, impersonateUser, updateProfile, registerUser, changeFirstPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { loginLimiter, registerLimiter, strictLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-first-password', protect, changeFirstPassword);
router.post('/register-user', protect, authorize('System Admin', 'Super Admin'), registerUser);
router.post('/impersonate', protect, authorize('System Admin', 'Super Admin'), strictLimiter, impersonateUser);

module.exports = router;
