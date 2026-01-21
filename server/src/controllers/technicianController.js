const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Get tickets assigned to technician (cross-tenant)
// @route   GET /api/technician/assigned
// @access  Private (Technician)
exports.getAssignedTickets = async (req, res) => {
    try {
        // For technicians, get ALL tickets assigned to them regardless of company
        const tickets = await Ticket.find({
            $or: [
                { assignedTo: req.user.id },
                { technician: req.user.id }
            ]
        })
        .populate('requester', 'name email companyId')
        .populate('assignedTo', 'name email')
        .populate('technician', 'name email')
        .populate('company', 'name initials')
        .sort({ createdAt: -1 });

        // Add timeline data and company context
        const ticketsWithTimeline = tickets.map(ticket => {
            // Determine company name from various sources
            let companyName = 'Unknown Company';
            let companyInitials = 'UNK';
            
            if (ticket.company) {
                companyName = ticket.company.name;
                companyInitials = ticket.company.initials;
            } else if (ticket.companyId) {
                // Map company IDs to names (updated mapping)
                const companyMap = {
                    1: { name: 'MESOB IT Support Team', initials: 'MESOB' },
                    2: { name: 'Addis Ababa Land Development Bureau', initials: 'LDAB' },
                    3: { name: 'Addis Ababa Housing Development Corp', initials: 'AAHDC' },
                    4: { name: 'Traffic Management Authority', initials: 'TMAS' },
                    5: { name: 'Housing Development Bureau', initials: 'HDAB' },
                    16: { name: 'Siket Bank', initials: 'SIKET' },
                    17: { name: 'Commercial Bank of Ethiopia', initials: 'CBE' },
                    18: { name: 'Ethio Post', initials: 'POST' },
                    19: { name: 'Ethio Telecom', initials: 'TELE' },
                    20: { name: 'Ethiopian Electric Utility Services', initials: 'EEU' }
                };
                const company = companyMap[ticket.companyId];
                if (company) {
                    companyName = company.name;
                    companyInitials = company.initials;
                }
            }

            return {
                ...ticket.toObject(),
                companyDisplayName: companyName,
                companyDisplayInitials: companyInitials,
                timeline: [
                    {
                        timestamp: ticket.createdAt,
                        type: 'created',
                        user: ticket.requester?.name || 'Unknown',
                        content: 'Ticket created'
                    },
                    ...(ticket.assignedAt ? [{
                        timestamp: ticket.assignedAt,
                        type: 'assigned',
                        user: 'System',
                        content: 'Ticket assigned to technician'
                    }] : []),
                    ...(ticket.acceptedAt ? [{
                        timestamp: ticket.acceptedAt,
                        type: 'accepted',
                        user: ticket.technician?.name || 'Technician',
                        content: 'Ticket accepted by technician'
                    }] : []),
                    ...(ticket.resolvedAt ? [{
                        timestamp: ticket.resolvedAt,
                        type: 'resolved',
                        user: ticket.resolvedBy?.name || 'Technician',
                        content: 'Ticket resolved'
                    }] : [])
                ]
            };
        });

        res.json(ticketsWithTimeline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept and start ticket (combined action with optional note)
// @route   PUT /api/technician/:id/accept-and-start
// @access  Private (Technician)
exports.acceptAndStartTicket = async (req, res) => {
    try {
        console.log('=== ACCEPT AND START TICKET DEBUG ===');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        console.log('User:', req.user?.name, req.user?.id);
        
        const { initialNote } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        
        console.log('Found ticket:', ticket ? 'YES' : 'NO');
        if (!ticket) {
            console.log('Ticket not found with ID:', req.params.id);
            return res.status(404).json({ message: 'Ticket not found' });
        }

        console.log('Ticket assignedTo:', ticket.assignedTo);
        console.log('Ticket technician:', ticket.technician);
        console.log('Current user ID:', req.user.id);

        // Check if technician is assigned to this ticket
        if (ticket.assignedTo?.toString() !== req.user.id && ticket.technician?.toString() !== req.user.id) {
            console.log('Authorization failed - user not assigned to ticket');
            return res.status(403).json({ message: 'Not authorized to accept this ticket' });
        }

        const now = new Date();
        console.log('Setting timestamps:', now);
        
        // Prepare update data
        const updateData = {
            acceptedAt: now,
            startedAt: now,
            status: 'In Progress',
            technician: req.user.id,
            updatedAt: now
        };
        
        // Add initial note if provided
        if (initialNote && initialNote.trim()) {
            console.log('Adding initial note:', initialNote.trim());
            updateData.$push = {
                technicianNotes: {
                    note: initialNote.trim(),
                    technician: req.user.id,
                    createdAt: now
                }
            };
        }
        
        console.log('Updating ticket...');
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: false }
        );
        console.log('Ticket updated successfully');

        // Broadcast to Super Admin room (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to('SUPER_ADMIN').emit('ticket_accepted_and_started', {
                    ticketId: ticket._id,
                    technicianName: req.user.name,
                    acceptedAt: ticket.acceptedAt,
                    startedAt: ticket.startedAt,
                    hasInitialNote: !!initialNote
                });
                console.log('Socket broadcast sent');
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }

        console.log('Sending success response');
        res.json({ message: 'Ticket accepted and work started successfully', ticket: updatedTicket });
    } catch (error) {
        console.error('=== ACCEPT AND START ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept ticket (set acceptedAt timestamp) - Legacy endpoint
// @route   PUT /api/technician/:id/accept
// @access  Private (Technician)
exports.acceptTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if technician is assigned to this ticket
        if (ticket.assignedTo?.toString() !== req.user.id && ticket.technician?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to accept this ticket' });
        }

        // Update ticket with acceptance data
        ticket.acceptedAt = new Date();
        ticket.status = 'Accepted'; // New status for accepted but not started
        ticket.technician = req.user.id; // Ensure technician is set
        
        await ticket.save();

        // Broadcast to Super Admin room (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to('SUPER_ADMIN').emit('ticket_accepted', {
                    ticketId: ticket._id,
                    technicianName: req.user.name,
                    acceptedAt: ticket.acceptedAt
                });
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
            // Continue execution - don't fail the accept operation due to socket issues
        }

        res.json({ message: 'Ticket accepted successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start working on ticket
// @route   PUT /api/technician/:id/start
// @access  Private (Technician)
exports.startTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if technician is assigned to this ticket
        if (ticket.assignedTo?.toString() !== req.user.id && ticket.technician?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to start this ticket' });
        }

        // Update ticket with start data
        ticket.startedAt = new Date();
        ticket.status = 'In Progress';
        
        await ticket.save();

        // Broadcast to Super Admin room for KPI tracking (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to('SUPER_ADMIN').emit('ticket_started', {
                    ticketId: ticket._id,
                    technicianName: req.user.name,
                    startedAt: ticket.startedAt,
                    acceptedAt: ticket.acceptedAt,
                    responseTime: ticket.acceptedAt && ticket.assignedAt ? 
                        (new Date(ticket.acceptedAt) - new Date(ticket.assignedAt)) / (1000 * 60 * 60) : null
                });
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }

        res.json({ message: 'Ticket started successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Finish ticket and automatically request feedback from team leader
// @route   PUT /api/technician/:id/finish-and-request-feedback
// @access  Private (Technician)
exports.finishAndRequestFeedback = async (req, res) => {
    try {
        const { completionNote } = req.body;
        const ticket = await Ticket.findById(req.params.id)
            .populate('requester', 'name email role');
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if technician is assigned to this ticket
        if (ticket.assignedTo?.toString() !== req.user.id && ticket.technician?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to finish this ticket' });
        }

        const now = new Date();
        
        // Prepare update data
        const updateData = {
            finishedAt: now,
            feedbackRequestedAt: now,
            feedbackRequestedFrom: ticket.requester._id,
            status: 'Pending Feedback',
            updatedAt: now
        };
        
        // Add completion note if provided
        if (completionNote && completionNote.trim()) {
            updateData.$push = {
                technicianNotes: {
                    note: completionNote.trim(),
                    technician: req.user.id,
                    createdAt: now
                }
            };
        }
        
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: false }
        ).populate('requester', 'name email role');

        // Calculate work time for KPI
        const workTime = updatedTicket.startedAt ? 
            (new Date(updatedTicket.finishedAt) - new Date(updatedTicket.startedAt)) / (1000 * 60 * 60) : null;

        // Broadcast to Super Admin and Team Leader (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                // Notify Super Admin
                io.to('SUPER_ADMIN').emit('ticket_finished_feedback_requested', {
                    ticketId: ticket._id,
                    technicianName: req.user.name,
                    finishedAt: ticket.finishedAt,
                    feedbackRequestedAt: ticket.feedbackRequestedAt,
                    requestedFrom: ticket.requester.name,
                    workTime: workTime,
                    hasCompletionNote: !!completionNote
                });
                
                // Notify the team leader/requester
                io.to(`user:${ticket.requester._id}`).emit('feedback_request', {
                    ticketId: ticket._id,
                    ticketTitle: ticket.title,
                    technicianName: req.user.name,
                    message: `Work completed on ticket "${ticket.title}". Please provide feedback on the resolution.`
                });
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }

        res.json({ 
            message: 'Work finished and feedback requested successfully', 
            ticket: updatedTicket,
            workTime,
            requestedFrom: updatedTicket.requester.name 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Finish working on ticket - Legacy endpoint
// @route   PUT /api/technician/:id/finish
// @access  Private (Technician)
exports.finishTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if technician is assigned to this ticket
        if (ticket.assignedTo?.toString() !== req.user.id && ticket.technician?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to finish this ticket' });
        }

        // Update ticket with finish data
        ticket.finishedAt = new Date();
        ticket.status = 'Completed'; // Waiting for feedback request
        
        await ticket.save();

        // Calculate work time for KPI
        const workTime = ticket.startedAt ? 
            (new Date(ticket.finishedAt) - new Date(ticket.startedAt)) / (1000 * 60 * 60) : null;

        // Broadcast to Super Admin room for KPI tracking (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to('SUPER_ADMIN').emit('ticket_finished', {
                    ticketId: ticket._id,
                    technicianName: req.user.name,
                    finishedAt: ticket.finishedAt,
                    startedAt: ticket.startedAt,
                    workTime: workTime
                });
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }

        res.json({ message: 'Ticket finished successfully', ticket, workTime });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request feedback from team leader
// @route   PUT /api/technician/:id/request-feedback
// @access  Private (Technician)
exports.requestFeedback = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('requester', 'name email role');
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if technician is assigned to this ticket
        if (ticket.assignedTo?.toString() !== req.user.id && ticket.technician?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to request feedback for this ticket' });
        }

        // Update ticket with feedback request data
        ticket.feedbackRequestedAt = new Date();
        ticket.feedbackRequestedFrom = ticket.requester._id; // Request from the person who created the ticket
        ticket.status = 'Pending Feedback';
        
        await ticket.save();

        // Broadcast to Super Admin and Team Leader (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to('SUPER_ADMIN').emit('feedback_requested', {
                    ticketId: ticket._id,
                    technicianName: req.user.name,
                    feedbackRequestedAt: ticket.feedbackRequestedAt,
                    requestedFrom: ticket.requester.name
                });
                
                // Notify the team leader/requester
                io.to(`user:${ticket.requester._id}`).emit('feedback_request', {
                    ticketId: ticket._id,
                    ticketTitle: ticket.title,
                    technicianName: req.user.name
                });
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }

        res.json({ 
            message: 'Feedback requested successfully', 
            ticket,
            requestedFrom: ticket.requester.name 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add technician note
// @route   POST /api/technician/:id/notes
// @access  Private (Technician)
exports.addTechnicianNote = async (req, res) => {
    try {
        const { note } = req.body;
        
        if (!note || note.trim().length === 0) {
            return res.status(400).json({ message: 'Note content is required' });
        }
        
        if (note.length > 500) {
            return res.status(400).json({ message: 'Note must be 500 characters or less' });
        }

        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Add note to technician notes array
        const newNote = {
            note: note.trim(),
            technician: req.user.id,
            createdAt: new Date()
        };

        if (!ticket.technicianNotes) {
            ticket.technicianNotes = [];
        }
        
        ticket.technicianNotes.push(newNote);
        await ticket.save();

        res.json({ 
            message: 'Note added successfully', 
            note: newNote,
            remainingChars: 500 - note.trim().length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update duty status
// @route   PUT /api/technician/duty-status
// @access  Private (Technician)
exports.updateDutyStatus = async (req, res) => {
    try {
        console.log('updateDutyStatus called with:', req.body);
        console.log('User ID:', req.user.id);
        
        const { dutyStatus } = req.body;
        
        if (!['Online', 'On-Site', 'Break', 'Offline'].includes(dutyStatus)) {
            console.log('Invalid duty status:', dutyStatus);
            return res.status(400).json({ message: 'Invalid duty status' });
        }

        console.log('Finding user with ID:', req.user.id);
        const user = await User.findById(req.user.id);
        
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Current user duty status:', user.dutyStatus);
        console.log('Updating to:', dutyStatus);
        
        user.dutyStatus = dutyStatus;
        user.dutyStatusUpdatedAt = new Date();
        
        console.log('Saving user...');
        await user.save({ validateBeforeSave: false });
        console.log('User saved successfully');

        // Broadcast to Super Admin room (with error handling)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to('SUPER_ADMIN').emit('technician_status_changed', {
                    technicianId: user._id,
                    technicianName: user.name,
                    dutyStatus: dutyStatus,
                    updatedAt: user.dutyStatusUpdatedAt
                });
                console.log('Broadcast sent to SUPER_ADMIN');
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }

        console.log('Sending response...');
        res.json({ message: 'Duty status updated', dutyStatus });
    } catch (error) {
        console.error('Error in updateDutyStatus:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get technician performance metrics
// @route   GET /api/technician/performance
// @access  Private (Technician)
exports.getPerformanceMetrics = async (req, res) => {
    try {
        const technicianId = req.user.id;
        
        // Get all tickets handled by this technician
        const tickets = await Ticket.find({
            $or: [
                { assignedTo: technicianId },
                { technician: technicianId },
                { resolvedBy: technicianId }
            ]
        });

        // Calculate metrics
        const acceptedTickets = tickets.filter(t => t.acceptedAt);
        const resolvedTickets = tickets.filter(t => t.resolvedAt);
        
        // Average Response Time (assignedAt to acceptedAt)
        let totalResponseTime = 0;
        let responseTimeCount = 0;
        
        acceptedTickets.forEach(ticket => {
            if (ticket.assignedAt && ticket.acceptedAt) {
                const responseTime = (new Date(ticket.acceptedAt) - new Date(ticket.assignedAt)) / (1000 * 60 * 60); // hours
                totalResponseTime += responseTime;
                responseTimeCount++;
            }
        });
        
        const avgResponseTime = responseTimeCount > 0 ? (totalResponseTime / responseTimeCount).toFixed(2) : 0;
        
        // Average Resolution Time (acceptedAt to resolvedAt)
        let totalResolutionTime = 0;
        let resolutionTimeCount = 0;
        
        resolvedTickets.forEach(ticket => {
            if (ticket.acceptedAt && ticket.resolvedAt) {
                const resolutionTime = (new Date(ticket.resolvedAt) - new Date(ticket.acceptedAt)) / (1000 * 60 * 60); // hours
                totalResolutionTime += resolutionTime;
                resolutionTimeCount++;
            }
        });
        
        const avgResolutionTime = resolutionTimeCount > 0 ? (totalResolutionTime / resolutionTimeCount).toFixed(2) : 0;
        
        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayResolved = tickets.filter(t => 
            t.resolvedAt && 
            new Date(t.resolvedAt) >= today && 
            new Date(t.resolvedAt) < tomorrow
        ).length;
        
        const totalAssigned = tickets.length;
        const totalResolved = resolvedTickets.length;
        const totalAccepted = acceptedTickets.length;
        
        res.json({
            avgResponseTime: parseFloat(avgResponseTime),
            avgResolutionTime: parseFloat(avgResolutionTime),
            todayResolved,
            totalAssigned,
            totalResolved,
            totalAccepted,
            responseTimeCount,
            resolutionTimeCount
        });
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
        try {
            if (io) {
                if (cid) {
                    io.to(`company:${cid}`).emit('ticket_updated', updatedTicket);
                } else {
                    io.emit('ticket_updated', updatedTicket);
                }
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
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

// @desc    Resolve ticket with enhanced resolution data
// @route   PUT /api/technician/:id/resolve
// @access  Private
exports.resolveTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Validate required resolution fields
        const { category, resolutionCode, rootCause, actionTaken } = req.body;
        
        if (!category || !resolutionCode || !rootCause || !actionTaken) {
            return res.status(400).json({ 
                message: 'Missing required fields: category, resolutionCode, rootCause, and actionTaken are required' 
            });
        }

        // Update ticket with resolution data
        const resolutionData = {
            status: 'Resolved',
            resolvedAt: new Date(),
            resolvedBy: req.user.id,
            resolutionCategory: category,
            resolutionCode: resolutionCode,
            rootCause: rootCause,
            actionTaken: actionTaken,
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
        try {
            if (io) {
                if (cid) {
                    io.to(`company:${cid}`).emit('ticket_updated', resolvedTicket);
                } else {
                    io.emit('ticket_updated', resolvedTicket);
                }
                // Also notify Super Admin
                io.to('SUPER_ADMIN').emit('ticket_resolved', {
                    ticketId: resolvedTicket._id,
                    technicianName: req.user.name,
                    resolvedAt: resolvedTicket.resolvedAt,
                    resolutionCategory: resolvedTicket.resolutionCategory
                });
            }
        } catch (socketError) {
            console.warn('Socket.io broadcast failed:', socketError.message);
        }
        res.json(resolvedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
