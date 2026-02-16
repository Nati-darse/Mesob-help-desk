const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getCompanies, updateCompany, createCompany } = require('../controllers/companyController');

router.get('/', getCompanies);
router.use(protect);
router.post('/', authorize('System Admin', 'Super Admin'), createCompany);
router.put('/:id', authorize('System Admin', 'Super Admin'), updateCompany);

module.exports = router;
