const express = require('express');
const router = express.Router();
const { getStats, getAdminStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');
const checkMaintenance = require('../middleware/maintenanceMiddleware');

router.use(protect);
router.use(checkMaintenance);
router.get('/stats', getStats);
router.get('/admin-stats', authorize('Admin', 'Super Admin', 'System Admin'), getAdminStats);

module.exports = router;
