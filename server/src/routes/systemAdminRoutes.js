const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCleanupStats,
  runBulkCleanup,
  exportData,
  getSystemOverview,
  getGlobalDashboard,
  getCrossTenantAnalytics,
  getSystemMonitor
} = require('../controllers/systemAdminController');

router.use(protect);
router.use(authorize('System Admin', 'Super Admin'));

router.get('/cleanup-stats', getCleanupStats);
router.post('/bulk-cleanup', runBulkCleanup);
router.get('/export-data/:type', exportData);

router.get('/overview', getSystemOverview);
router.get('/global-dashboard', getGlobalDashboard);
router.get('/cross-tenant-analytics', getCrossTenantAnalytics);
router.get('/system-monitor', getSystemMonitor);

module.exports = router;
