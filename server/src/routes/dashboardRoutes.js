const express = require('express');
const router = express.Router();
const { getStats, getAdminStats } = require('../controllers/dashboardController');
const { authorize } = require('../middleware/authMiddleware');

// Dashboard routes (protect is handled in index.js)
router.get('/stats', getStats);
router.get('/admin-stats', authorize('Admin', 'Super Admin', 'System Admin'), getAdminStats);

module.exports = router;
