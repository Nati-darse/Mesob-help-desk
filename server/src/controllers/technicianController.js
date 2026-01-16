const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Get tickets assigned to technician
// @route   GET /api/tickets/assigned
// @access  Private (Technician)
exports.getAssignedTickets = async (req, res) => {
    try {
        // Get tickets assigned to current technician or their team
        const tickets = await Ticket.find({
            $or: [
                { assignedTo: req.user.id },
                { assignedTeam: req.user.department }
            ]
        })
        .populate('requester', 'name email')
        .populate('assignedTo', 'name email')
        .populate('company', 'name initials')
        .sort({ createdAt: -1 });

        // Add mock timeline data
        const ticketsWithTimeline = tickets.map(ticket => ({
            ...ticket.toObject(),
            timeline: [
                {
                    timestamp: ticket.createdAt,
                    type: 'created',
                    user: ticket.requester?.name || 'Unknown',
                    content: 'Ticket created'
                }
            ]
        }));

        res.json(ticketsWithTimeline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single ticket details
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('requester', 'name email phone')
            .populate('assignedTo', 'name email')
            .populate('company', 'name initials');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Update ticket
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );

        const io = req.app.get('io');
        const cid = (updatedTicket && updatedTicket.companyId) || req.tenantId || (req.user && req.user.companyId);
        if (io) {
            if (cid) {
                io.to(`company:${cid}`).emit('ticket_updated', updatedTicket);
            } else {
                io.emit('ticket_updated', updatedTicket);
            }
        }
        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add internal notes to ticket
// @route   PUT /api/tickets/:id/internal-notes
// @access  Private
exports.addInternalNotes = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.internalNotes = req.body.internalNotes;
        await ticket.save();

        res.json({ message: 'Internal notes updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add customer update to ticket
// @route   POST /api/tickets/:id/updates
// @access  Private
exports.addCustomerUpdate = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Add update to ticket updates array
        const update = {
            message: req.body.message,
            type: req.body.type || 'customer',
            timestamp: new Date(),
            user: req.user.name
        };

        if (!ticket.updates) {
            ticket.updates = [];
        }
        ticket.updates.push(update);
        await ticket.save();

        res.json({ message: 'Update added' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resolve ticket
// @route   PUT /api/tickets/:id/resolve
// @access  Private
exports.resolveTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Update ticket with resolution data
        const resolutionData = {
            status: 'Resolved',
            resolvedAt: new Date(),
            resolvedBy: req.user.id,
            resolutionCategory: req.body.category,
            resolutionCode: req.body.resolutionCode,
            timeSpent: req.body.timeSpent,
            partsUsed: req.body.partsUsed,
            nextSteps: req.body.nextSteps,
            ...req.body
        };

        const resolvedTicket = await Ticket.findByIdAndUpdate(
            req.params.id, 
            resolutionData, 
            { new: true }
        );

        const io = req.app.get('io');
        const cid = (resolvedTicket && resolvedTicket.companyId) || req.tenantId || (req.user && req.user.companyId);
        if (io) {
            if (cid) {
                io.to(`company:${cid}`).emit('ticket_updated', resolvedTicket);
            } else {
                io.emit('ticket_updated', resolvedTicket);
            }
        }
        res.json(resolvedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
