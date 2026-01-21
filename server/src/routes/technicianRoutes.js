const express = require('express');
const router = express.Router();
const { 
    getAssignedTickets, 
    getTicketById, 
    updateTicket, 
    addInternalNotes, 
    addCustomerUpdate, 
    resolveTicket,
    acceptTicket,
    acceptAndStartTicket,
    startTicket,
    finishTicket,
    finishAndRequestFeedback,
    requestFeedback,
    addTechnicianNote,
    updateDutyStatus,
    getPerformanceMetrics
} = require('../controllers/technicianController');
const { protect } = require('../middleware/authMiddleware');
const checkMaintenance = require('../middleware/maintenanceMiddleware');

// Protect all routes
router.use(protect);
router.use(checkMaintenance);

// Get assigned tickets
router.get('/assigned', getAssignedTickets);

// Get performance metrics
router.get('/performance', getPerformanceMetrics);

// Update duty status
router.put('/duty-status', updateDutyStatus);

// Accept and start ticket (combined action)
router.put('/:id/accept-and-start', acceptAndStartTicket);

// Accept ticket (legacy)
router.put('/:id/accept', acceptTicket);

// Start working on ticket
router.put('/:id/start', startTicket);

// Finish and request feedback (combined action)
router.put('/:id/finish-and-request-feedback', finishAndRequestFeedback);

// Finish working on ticket (legacy)
router.put('/:id/finish', finishTicket);

// Request feedback from team leader
router.put('/:id/request-feedback', requestFeedback);

// Add technician note
router.post('/:id/notes', addTechnicianNote);

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
