const express = require('express');
const router = express.Router();
const { 
    getAssignedTickets, 
    getTicketById, 
    updateTicket, 
    addInternalNotes, 
    addCustomerUpdate, 
    resolveTicket,
    updateDutyStatus,
    getPerformanceMetrics
} = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceMaintenance } = require('../middleware/maintenanceMiddleware');

// Protect all routes and restrict to Technician role
router.use(protect);
router.use(enforceMaintenance);
router.use(authorize('Technician', 'Admin', 'Super Admin', 'System Admin')); // Add role authorization

// Update duty status
router.put('/duty-status', updateDutyStatus);

// Get performance metrics
router.get('/performance', getPerformanceMetrics);

// Get assigned tickets
router.get('/assigned', getAssignedTickets);

// Get single ticket
router.get('/:id', getTicketById);

// Update ticket
router.put('/:id', updateTicket);

// Add internal notes
router.put('/:id/internal-notes', addInternalNotes);

// Add customer update
router.post('/:id/updates', addCustomerUpdate);

// Resolve ticket
router.put('/:id/resolve', resolveTicket);

module.exports = router;
