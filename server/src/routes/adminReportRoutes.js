const express = require('express');
const router = express.Router();
const { getTicketsReport, getPerformanceReport } = require('../controllers/adminReportController');
const { authorize } = require('../middleware/authMiddleware');

// Role authorization (protect is handled in index.js)
router.use(authorize('Admin', 'Super Admin', 'System Admin'));

// Get tickets report with filters
router.get('/tickets', getTicketsReport);

// Get performance report
router.get('/performance', getPerformanceReport);

module.exports = router;
