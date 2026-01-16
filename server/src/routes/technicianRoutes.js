const express = require('express');
const router = express.Router();
const { 
    getAssignedTickets, 
    getTicketById, 
    updateTicket, 
    addInternalNotes, 
    addCustomerUpdate, 
    resolveTicket 
} = require('../controllers/technicianController');
const { protect } = require('../middleware/authMiddleware');
const { enforceMaintenance } = require('../middleware/maintenanceMiddleware');

// Protect all routes
router.use(protect);
router.use(enforceMaintenance);

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
