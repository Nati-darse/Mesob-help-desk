const express = require('express');
const router = express.Router();
const { broadcastMessage, getMyNotifications, getBroadcasts } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.get('/broadcasts', authorize('System Admin', 'Super Admin'), getBroadcasts);
router.post('/broadcast', authorize('System Admin', 'Super Admin'), broadcastMessage);

module.exports = router;
