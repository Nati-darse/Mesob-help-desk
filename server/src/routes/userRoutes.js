const express = require('express');
const router = express.Router();
const { getTechnicians, updateAvailability, getAllUsers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceMaintenance } = require('../middleware/maintenanceMiddleware');

router.use(protect);
router.use(enforceMaintenance);
router.get('/technicians', authorize('Team Lead', 'Admin', 'System Admin'), getTechnicians);
router.put('/availability', updateAvailability);
router.get('/global', authorize('System Admin'), getAllUsers);
router.put('/:id/role', authorize('System Admin'), updateUserRole);

module.exports = router;
