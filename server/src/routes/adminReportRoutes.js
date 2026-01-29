const express = require('express');
const router = express.Router();
const { getTicketsReport, getPerformanceReport } = require('../controllers/adminReportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceMaintenance } = require('../middleware/maintenanceMiddleware');

// Protect all routes and restrict to admins
router.use(protect);
router.use(enforceMaintenance);
router.use(authorize('Admin', 'Super Admin', 'System Admin'));

// Get tickets report with filters
router.get('/tickets', getTicketsReport);

// Get performance report
router.get('/performance', getPerformanceReport);

module.exports = router;
