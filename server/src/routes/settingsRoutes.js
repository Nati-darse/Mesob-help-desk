const express = require('express');
const router = express.Router();
const { getMaintenance, setMaintenance, getSMTP, setSMTP } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/maintenance', authorize('System Admin', 'Super Admin'), getMaintenance);
router.put('/maintenance', authorize('System Admin', 'Super Admin'), setMaintenance);

router.get('/smtp', authorize('System Admin', 'Super Admin'), getSMTP);
router.put('/smtp', authorize('System Admin', 'Super Admin'), setSMTP);

module.exports = router;

