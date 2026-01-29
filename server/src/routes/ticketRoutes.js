const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTickets,
    getTicket,
    updateTicket,
    assignTicket,
    addComment,
    resolveTicket,
    rateTicket,
    addWorkLog,
    reviewTicket,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceMaintenance } = require('../middleware/maintenanceMiddleware');

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Ticket routes are working', timestamp: new Date() });
});

router.use(protect); // All ticket routes are protected
router.use(enforceMaintenance);

router.route('/')
    .post(createTicket)
    .get(getTickets);

router.route('/:id')
    .get(getTicket)
    .put(updateTicket);

router.put('/:id/assign', authorize('Team Lead', 'Admin', 'Super Admin', 'System Admin'), assignTicket);
router.post('/:id/comment', addComment);
router.put('/:id/resolve', authorize('Technician', 'Admin', 'Super Admin', 'System Admin'), resolveTicket);
router.put('/:id/rate', rateTicket);
router.post('/:id/worklog', authorize('Technician', 'Admin', 'Super Admin', 'System Admin'), addWorkLog);
router.put('/:id/review', authorize('Admin', 'Super Admin', 'System Admin'), reviewTicket);

module.exports = router;
