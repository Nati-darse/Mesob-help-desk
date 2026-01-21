const express = require('express');
const router = express.Router();
const { getTechnicians, updateAvailability, getAllUsers, updateUserRole, createUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const checkMaintenance = require('../middleware/maintenanceMiddleware');

router.use(protect);
router.use(checkMaintenance);
router.get('/technicians', authorize('Team Lead', 'Admin', 'System Admin'), getTechnicians);
router.put('/availability', updateAvailability);
router.get('/global', authorize('System Admin'), getAllUsers);
router.put('/:id/role', authorize('System Admin'), updateUserRole);
router.post('/', authorize('Admin', 'System Admin'), createUser);

module.exports = router;
