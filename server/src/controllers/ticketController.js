const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendEmail, sendSMS } = require('../services/notificationService');

const emitUpdate = (req, event, data) => {
    const io = req.app.get('io');
    if (!io) return;
    const cid = (data && data.companyId) || req.tenantId || (req.user && req.user.companyId);
    if (cid) {
        io.to(`company:${cid}`).emit(event, data);
    } else {
        io.emit(event, data);
    }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Worker)
exports.createTicket = async (req, res) => {
    try {
        console.log('=== TICKET CREATION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('User info:', req.user);
        console.log('Headers:', req.headers);

        const { title, description, category, priority, buildingWing, companyId } = req.body;

        // Basic validation
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        // Create ticket with minimal required fields
        const ticketData = {
            title: title.trim(),
            description: description.trim(),
            category: category || 'Other',
            priority: priority || 'Medium',
            buildingWing: buildingWing || '',
            companyId: companyId || req.user?.companyId || 1,
            requester: req.user?._id,
            department: req.user?.department || 'General',
            status: req.body.status || 'New',
        };

        console.log('Ticket data to create:', ticketData);

        const ticket = await Ticket.create(ticketData);

        console.log('Ticket created successfully:', ticket._id);

        // Skip email for now to isolate the issue
        console.log('Skipping email for debugging');

        // Skip socket.io for now to isolate the issue
        console.log('Skipping socket.io for debugging');

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: ticket
        });
    } catch (error) {
        console.error('=== TICKET CREATION ERROR ===');
        console.error('Error details:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
            details: error.stack
        });
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
            const base = { requester: req.user._id };
            const scoped = req.tenantId ? { ...base, companyId: req.tenantId } : base;
            query = Ticket.find(scoped);
        } else if (req.user.role === 'Technician') {
            const base = { technician: req.user._id };
            const scoped = req.tenantId ? { ...base, companyId: req.tenantId } : base;
            query = Ticket.find(scoped);
        } else {
            const scoped = req.tenantId ? { companyId: req.tenantId } : {};
            query = Ticket.find(scoped);
        }

        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.max(parseInt(req.query.pageSize || '20', 10), 1);

        const total = await Ticket.countDocuments(query.getQuery());

        const tickets = await query
            .select('title status priority companyId createdAt') // projection for table views
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean();

        // Non-breaking change: return array, but include pagination via headers
        res.set('X-Total-Count', String(total));
        res.set('X-Page', String(page));
        res.set('X-Page-Size', String(pageSize));
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
        if (req.user.role === 'Worker' && ticket.requester._id.toString() !== req.user._id.toString()) {
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

        emitUpdate(req, 'ticket_updated', ticket);
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
            user: req.user._id,
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
// @desc    Add work log entry
// @route   POST /api/tickets/:id/worklog
// @access  Private (Technician/Admin)
exports.addWorkLog = async (req, res) => {
    try {
        const { note } = req.body;
        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.workLog.push({
            note,
            technician: req.user._id
        });

        await ticket.save();
        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
