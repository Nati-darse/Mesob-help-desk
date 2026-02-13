const express = require('express');
const router = express.Router();
const { getStats, getAdminStats, getRealtimeStats } = require('../controllers/dashboardController');
const { authorize } = require('../middleware/authMiddleware');

// Dashboard routes (protect is handled in index.js)
router.get('/stats', getStats);
router.get('/admin-stats', authorize('Admin', 'Super Admin', 'System Admin'), getAdminStats);
router.get('/realtime', authorize('Admin', 'Super Admin', 'System Admin'), getRealtimeStats);

module.exports = router;
