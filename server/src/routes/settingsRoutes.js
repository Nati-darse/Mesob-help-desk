const express = require('express');
const router = express.Router();
const { getMaintenance, setMaintenance } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/maintenance', authorize('System Admin'), getMaintenance);
router.put('/maintenance', authorize('System Admin'), setMaintenance);

module.exports = router;

