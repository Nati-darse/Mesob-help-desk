const express = require('express');
const router = express.Router();
const { 
  getMaintenance, 
  setMaintenance, 
  getSMTP, 
  setSMTP,
  getGlobalSettings,
  setGlobalSettings,
  testEmail,
  rotateKeys,
  createBackup,
  resetGlobalSettings,
  getEnvInfo
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/maintenance', authorize('System Admin', 'Super Admin'), getMaintenance);
router.put('/maintenance', authorize('System Admin', 'Super Admin'), setMaintenance);

router.get('/smtp', authorize('System Admin', 'Super Admin'), getSMTP);
router.put('/smtp', authorize('System Admin', 'Super Admin'), setSMTP);

router.get('/global', authorize('System Admin', 'Super Admin'), getGlobalSettings);
router.put('/global', authorize('System Admin', 'Super Admin'), setGlobalSettings);
router.post('/test-email', authorize('System Admin', 'Super Admin'), testEmail);
router.post('/rotate-keys', authorize('System Admin', 'Super Admin'), rotateKeys);
router.post('/backup', authorize('System Admin', 'Super Admin'), createBackup);
router.post('/reset', authorize('System Admin', 'Super Admin'), resetGlobalSettings);
router.get('/env', authorize('System Admin', 'Super Admin'), getEnvInfo);

module.exports = router;

