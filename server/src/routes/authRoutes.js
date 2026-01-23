const express = require('express');
const router = express.Router();
const { register, login, getMe, impersonateUser, updateProfile, registerUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/register-user', protect, authorize('System Admin', 'Super Admin'), registerUser);
router.post('/impersonate', protect, authorize('System Admin', 'Super Admin'), impersonateUser);

module.exports = router;
