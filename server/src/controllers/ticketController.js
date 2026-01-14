const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendEmail, sendSMS } = require('../services/notificationService');

// Helper to emit socket events
const emitUpdate = (req, event, data) => {
    const io = req.app.get('io');
    if (io) io.emit(event, data);
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Worker)
exports.createTicket = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;

        const ticket = await Ticket.create({
            title,
            description,
            category,
            priority,
            requester: req.user.id,
            department: req.user.department,
        });

        // Send confirmation to requester
        await sendEmail(
            req.user.email,
            `Ticket Created: ${ticket.title}`,
            `Your ticket has been created with ID: ${ticket._id}. Priority: ${ticket.priority}.`,
            `<h2>Ticket Confirmation</h2><p>Your ticket <b>${ticket.title}</b> has been created.</p><p>Priority: <b>${ticket.priority}</b></p>`
        );

        emitUpdate(req, 'ticket_created', ticket);

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private (All authenticated users, filtered by role)
exports.getTickets = async (req, res) => {
    try {
        let query;

        // Filter by role
        if (req.user.role === 'Worker') {
            query = Ticket.find({ requester: req.user.id });
        } else if (req.user.role === 'Technician') {
            query = Ticket.find({ technician: req.user.id });
        } else {
            // Admin or Team Lead can see all
            query = Ticket.find();
        }

        const tickets = await query.populate('requester', 'name email department').populate('technician', 'name email');
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('requester', 'name email department')
            .populate('technician', 'name email')
            .populate('comments.user', 'name role');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if user is authorized to see this ticket
        if (req.user.role === 'Worker' && ticket.requester._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to access this ticket' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id
// @access  Private (Technician/Admin)
exports.updateTicket = async (req, res) => {
    try {
        let ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Assign ticket to technician
// @route   PUT /api/tickets/:id/assign
// @access  Private (Team Lead/Admin)
exports.assignTicket = async (req, res) => {
    try {
        const { technicianId } = req.body;

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.technician = technicianId;
        ticket.status = 'Assigned';
        await ticket.save();

        const tech = await User.findById(technicianId);
        if (tech) {
            // Email to technician
            await sendEmail(
                tech.email,
                'New Ticket Assigned',
                `You have been assigned a new ticket: ${ticket.title}. Priority: ${ticket.priority}.`,
                `<h2>New Assignment</h2><p>You have been assigned to: <b>${ticket.title}</b></p><p>Priority: <b>${ticket.priority}</b></p>`
            );

            // SMS if critical
            if (ticket.priority === 'Critical') {
                await sendSMS(tech.phone || '+1234567890', `URGENT: New Critical Ticket Assigned - ${ticket.title}`);
            }
        }

        emitUpdate(req, 'ticket_updated', ticket);

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add comment to ticket
// @route   POST /api/tickets/:id/comment
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const comment = {
            user: req.user.id,
            text,
        };

        ticket.comments.push(comment);
        await ticket.save();

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resolve ticket
// @route   PUT /api/tickets/:id/resolve
// @access  Private (Technician/Admin)
exports.resolveTicket = async (req, res) => {
    try {
        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.status = 'Resolved';
        await ticket.save();

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Rate and close ticket
// @route   PUT /api/tickets/:id/rate
// @access  Private (Requester)
exports.rateTicket = async (req, res) => {
    try {
        const { rating, feedback } = req.body;

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.rating = rating;
        ticket.feedback = feedback;
        ticket.status = 'Closed';
        await ticket.save();

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
