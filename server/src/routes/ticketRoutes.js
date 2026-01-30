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
} = require('../controllers/ticketController');
const { authorize } = require('../middleware/authMiddleware');

// Ticket routes (protect is handled in index.js)
router.route('/')
    .post(createTicket)
    .get(getTickets);

router.route('/:id')
    .get(getTicket)
    .put(updateTicket);

router.put('/:id/assign', authorize('Team Lead', 'Admin'), assignTicket);
router.post('/:id/comment', addComment);
router.put('/:id/resolve', authorize('Technician', 'Admin'), resolveTicket);
router.put('/:id/rate', rateTicket);
router.post('/:id/worklog', authorize('Technician', 'Admin'), addWorkLog);

module.exports = router;
