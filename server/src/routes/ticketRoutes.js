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
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All ticket routes are protected

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

module.exports = router;
