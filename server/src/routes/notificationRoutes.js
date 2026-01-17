const express = require('express');
const router = express.Router();
const { broadcastMessage, getMyNotifications } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.post('/broadcast', authorize('System Admin'), broadcastMessage);

module.exports = router;
