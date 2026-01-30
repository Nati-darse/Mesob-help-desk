const express = require('express');
const router = express.Router();
const { getTechnicians, updateAvailability, getAllUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const { authorize } = require('../middleware/authMiddleware');

// Role authorization (protect is handled in index.js)
router.get('/technicians', authorize('Team Lead', 'Admin', 'System Admin', 'Super Admin'), getTechnicians);
router.put('/availability', updateAvailability);
router.get('/global', authorize('System Admin', 'Super Admin'), getAllUsers);
router.put('/:id/role', authorize('System Admin', 'Super Admin'), updateUserRole);
router.delete('/:id', authorize('System Admin', 'Super Admin'), deleteUser);

module.exports = router;
