const express = require('express');
const router = express.Router();
const { getTechnicians } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/technicians', authorize('Team Lead', 'Admin'), getTechnicians);

module.exports = router;
