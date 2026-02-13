const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getCompanies, updateCompany, createCompany } = require('../controllers/companyController');

router.use(protect);
router.get('/', getCompanies);
router.post('/', authorize('System Admin', 'Super Admin'), createCompany);
router.put('/:id', authorize('System Admin', 'Super Admin'), updateCompany);

module.exports = router;
