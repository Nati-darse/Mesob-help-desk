const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendEmail, sendSMS } = require('../services/notificationService');

const emitUpdate = (req, event, data) => {
    try {
        const io = req.app.get('io');
        if (!io) return;
        const cid = (data && data.companyId) || req.tenantId || (req.user && req.user.companyId);
        if (cid) {
            io.to(`company:${cid}`).emit(event, data);

            // Also notify Mesob Digitalization Team (Company 20) for all ticket events
            // as they are the global workforce managing these tickets.
            if (String(cid) !== '20') {
                io.to('company:20').emit(event, data);
            }
        } else {
            io.emit(event, data);
        }
    } catch (err) {
        console.error('Socket Emit Error:', err.message);
    }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Worker)
exports.createTicket = async (req, res) => {
    try {
        const { title, description, category, priority, buildingWing, companyId } = req.body;

        const ticket = await Ticket.create({
            title,
            description,
            category,
            priority,
            buildingWing,
            companyId: companyId || req.tenantId || req.user.companyId || 1,
            requester: req.user._id,
            department: req.user.department || 'General', // Fallback
        });

        // Send confirmation to requester (Non-blocking)
        try {
            await sendEmail(
                req.user.email,
                `Ticket Created: ${ticket.title}`,
                `Your ticket has been created with ID: ${ticket._id}. Priority: ${ticket.priority}.`,
                `<h2>Ticket Confirmation</h2><p>Your ticket <b>${ticket.title}</b> has been created.</p><p>Priority: <b>${ticket.priority}</b></p>`
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            // Continue execution, do not fail ticket creation
        }

        emitUpdate(req, 'ticket_created', ticket);

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Ticket Error Stack:', error.stack);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private (All authenticated users, filtered by role)
exports.getTickets = async (req, res) => {
    try {
        let query;

        // Build criteria based on role and query parameters
        let criteria = {};

        // Role-based restrictions
        // Enforce company scoping for non-global admins
        // NOTE: Mesob Staff (Company 20) are global admins/technicians
        const globalAdminRoles = ['System Admin', 'Super Admin', 'Admin'];
        const isMesobStaff = req.user.companyId === 20;

        if (globalAdminRoles.includes(req.user.role) && isMesobStaff) {
            // Global admins from Mesob can see everything or filter by tenant header
            if (req.tenantId) {
                criteria.companyId = req.tenantId;
            }
        } else if (req.user.role === 'Technician' && isMesobStaff) {
            // Technicians from Mesob see their own assigned tickets across all companies
            criteria.technician = req.user._id;
        } else {
            // Client employees (Workers, Team Leads) are strictly scoped to their company
            criteria.companyId = req.user.companyId;

            // If they are a worker, further restrict to their own tickets
            if (req.user.role === 'Worker') {
                criteria.requester = req.user._id;
            }
        }

        // Add optional filters from query params
        if (req.query.status) criteria.status = req.query.status;
        if (req.query.reviewStatus) criteria.reviewStatus = req.query.reviewStatus;

        query = Ticket.find(criteria);

        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.max(parseInt(req.query.pageSize || '20', 10), 1);

        const total = await Ticket.countDocuments(query.getQuery());

        const tickets = await query
            .select('title status priority category companyId technician requester buildingWing reviewStatus reviewNotes updatedAt workLog createdAt')
            .populate('technician', 'name')
            .populate('requester', 'name')
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
// @access  Private (TECHNICIAN/Admin)
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
        console.log(`[AssignTicket] Request body:`, req.body);
        console.log(`[AssignTicket] Attempting to assign ticket ${req.params.id} to tech ${technicianId}`);

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            console.log(`[AssignTicket] Ticket ${req.params.id} not found`);
            return res.status(404).json({ message: 'Ticket not found' });
        }

        console.log(`[AssignTicket] Current ticket state: ${ticket.status}`);
        ticket.technician = technicianId;
        ticket.status = 'Assigned';

        console.log(`[AssignTicket] Saving ticket...`);
        const savedTicket = await ticket.save();
        console.log(`[AssignTicket] Ticket saved successfully: ${savedTicket._id}`);

        const tech = await User.findById(technicianId);
        if (tech) {
            console.log(`[AssignTicket] Attempting notifications for tech: ${tech.name} (${tech.email})`);

            // Email to technician - Wrapped in separate try/catch to be non-blocking
            try {
                await sendEmail(
                    tech.email,
                    'New Ticket Assigned',
                    `You have been assigned a new ticket: ${ticket.title}. Priority: ${ticket.priority}.`,
                    `<h2>New Assignment</h2><p>You have been assigned to: <b>${ticket.title}</b></p><p>Priority: <b>${ticket.priority}</b></p>`
                );
                console.log(`[AssignTicket] Email notification queued/sent`);
            } catch (emailErr) {
                console.error(`[AssignTicket] email notification failed:`, emailErr.message);
            }

            // SMS if critical
            if (ticket.priority === 'Critical') {
                try {
                    await sendSMS(tech.phone || '+1234567890', `URGENT: New Critical Ticket Assigned - ${ticket.title}`);
                    console.log(`[AssignTicket] SMS notification queued/sent`);
                } catch (smsErr) {
                    console.error(`[AssignTicket] SMS notification failed:`, smsErr.message);
                }
            }
        } else {
            console.log(`[AssignTicket] Technician ${technicianId} not found in database for notifications`);
        }

        emitUpdate(req, 'ticket_updated', savedTicket);
        console.log(`[AssignTicket] Assignment workflow complete`);

        res.json(savedTicket);
    } catch (error) {
        console.error('[AssignTicket] CRITICAL Error:', error);
        res.status(500).json({
            message: error.message,
            stack: error.stack,
            context: 'Assignment flow failed'
        });
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
// @access  Private (TECHNICIAN/Admin)
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

// @desc    Rate and submit for review
// @route   PUT /api/tickets/:id/rate
// @access  Private (Requester)
exports.rateTicket = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        console.log(`[RateTicket] ID: ${req.params.id} | Rating: ${rating}`);

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.rating = rating;
        ticket.feedback = feedback;
        ticket.reviewStatus = 'Pending';

        await ticket.save();
        console.log(`[RateTicket] Success - ReviewStatus: Pending`);

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        console.error('[RateTicket] Controller Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review ticket (Approve/Reject)
// @route   PUT /api/tickets/:id/review
// @access  Private (Admin/Super Admin/System Admin)
exports.reviewTicket = async (req, res) => {
    try {
        const { action, notes } = req.body;
        console.log(`[ReviewTicket] ${action} on ${req.params.id} by ${req.user.name}`);

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (ticket.status !== 'Resolved') {
            return res.status(400).json({ message: 'Only resolved tickets can be reviewed' });
        }

        if (action === 'approve') {
            ticket.status = 'Closed';
            ticket.reviewStatus = 'Approved';
        } else if (action === 'reject') {
            ticket.status = 'In Progress';
            ticket.reviewStatus = 'Rejected';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        ticket.reviewNotes = notes;
        ticket.reviewedBy = req.user._id;
        ticket.reviewedAt = new Date();

        await ticket.save();
        console.log(`[ReviewTicket] ${action} successful. Status: ${ticket.status}`);

        // Notification logic (Non-blocking)
        if (action === 'reject' && ticket.technician) {
            try {
                const tech = await User.findById(ticket.technician);
                if (tech) {
                    await sendEmail(
                        tech.email,
                        `Action Required: Ticket Rejected`,
                        `Your resolution for ticket ${ticket.title} was rejected. Notes: ${notes}`,
                        `<h2>Review Update</h2><p><b>Decision:</b> Rejected</p><p><b>Notes:</b> ${notes}</p>`
                    );
                }
            } catch (err) { console.error('[ReviewTicket] Email failed:', err.message); }
        }

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        console.error('[ReviewTicket] Controller Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add work log entry
// @route   POST /api/tickets/:id/worklog
// @access  Private (TECHNICIAN/Admin)
exports.addWorkLog = async (req, res) => {
    try {
        const { note } = req.body;
        console.log(`[AddWorkLog] Adding log for ${req.params.id} by ${req.user.name}`);

        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.workLog = ticket.workLog || [];
        ticket.workLog.push({
            note,
            technician: req.user._id,
            timestamp: new Date()
        });

        await ticket.save();
        console.log(`[AddWorkLog] Log saved successfully`);

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        console.error('[AddWorkLog] Error:', error);
        res.status(500).json({ message: error.message });
    }
};
