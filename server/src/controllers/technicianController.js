const Ticket = require('../models/Ticket');
const User = require('../models/User');

// @desc    Update technician duty status
// @route   PUT /api/technician/duty-status
// @access  Private (TECHNICIAN)
exports.updateDutyStatus = async (req, res) => {
    try {
        const { dutyStatus } = req.body;
        console.log(`[UpdateDutyStatus] User ${req.user?._id} requested status change to: ${dutyStatus}`);

        // Validate duty status
        const validStatuses = ['Online', 'On-Site', 'Break', 'Offline'];
        if (!validStatuses.includes(dutyStatus)) {
            console.log(`[UpdateDutyStatus] Invalid status requested: ${dutyStatus}`);
            return res.status(400).json({ message: 'Invalid duty status' });
        }

        // Update user's duty status
        const user = await User.findById(req.user._id);
        if (!user) {
            console.log(`[UpdateDutyStatus] User not found: ${req.user._id}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[UpdateDutyStatus] Persisting change for ${user.name}: ${user.dutyStatus} -> ${dutyStatus}`);
        user.dutyStatus = dutyStatus;
        user.isAvailable = (dutyStatus === 'Online');

        const updatedUser = await user.save();
        console.log(`[UpdateDutyStatus] Save successful. New DB state: ${updatedUser.dutyStatus}`);

        // Emit socket event for real-time updates (Global for centralized pool)
        const io = req.app.get('io');
        if (io) {
            console.log(`[UpdateDutyStatus] Emitting global socket update for technician: ${updatedUser.name}`);
            io.emit('technician_status_updated', updatedUser);
        }

        res.json({
            message: 'Duty status updated successfully',
            dutyStatus: updatedUser.dutyStatus,
            user: updatedUser
        });
    } catch (error) {
        console.error('[UpdateDutyStatus] CRITICAL Error:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

// @desc    Get technician performance metrics
// @route   GET /api/technician/performance
// @access  Private (TECHNICIAN)
exports.getPerformanceMetrics = async (req, res) => {
    try {
        const techId = req.user.id;
        
        // Get all tickets assigned to this technician
        const allTickets = await Ticket.find({ technician: techId });
        const resolvedTickets = allTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
        
        // Calculate average response time (time from creation to assignment)
        let totalResponseTime = 0;
        let responseTimeCount = 0;
        
        // Calculate average resolution time (time from creation to resolution)
        let totalResolutionTime = 0;
        let resolutionTimeCount = 0;
        
        resolvedTickets.forEach(ticket => {
            if (ticket.createdAt && ticket.updatedAt) {
                const resolutionTime = (new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60); // hours
                totalResolutionTime += resolutionTime;
                resolutionTimeCount++;
            }
        });
        
        // Get today's resolved tickets
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayResolved = resolvedTickets.filter(t => 
            new Date(t.updatedAt) >= startOfToday
        ).length;
        
        const avgResponseTime = responseTimeCount > 0 ? (totalResponseTime / responseTimeCount).toFixed(1) : '0';
        const avgResolutionTime = resolutionTimeCount > 0 ? (totalResolutionTime / resolutionTimeCount).toFixed(1) : '0';

        res.json({
            totalAssigned: allTickets.length,
            totalResolved: resolvedTickets.length,
            todayResolved,
            avgResponseTime,
            avgResolutionTime,
            responseTimeCount,
            resolutionTimeCount
        });
    } catch (error) {
        console.error('[GetMetrics] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assigned tickets for technician
// @route   GET /api/technician/assigned
// @access  Private (TECHNICIAN)
exports.getAssignedTickets = async (req, res) => {
    try {
        const { startDate, endDate, includeResolved } = req.query;
        
        // Build query
        const query = { technician: req.user.id };
        
        // Add status filter
        if (includeResolved === 'true') {
            // Include all statuses for reports
        } else {
            // Default: only active tickets
            query.status = { $in: ['Assigned', 'In Progress'] };
        }
        
        // Add date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // End of day
                query.createdAt.$lte = end;
            }
        }

        const tickets = await Ticket.find(query)
            .populate('requester', 'name email department')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error('[GetAssigned] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single ticket details for technician
// @route   GET /api/technician/:id
// @access  Private (TECHNICIAN)
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('requester', 'name email department phone')
            .populate('comments.user', 'name role');

        if (!ticket || String(ticket.technician) !== String(req.user.id)) {
            return res.status(404).json({ message: 'Ticket not found or not assigned to you' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('[GetTicketById] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket (Legacy name for internal updates)
exports.updateTicket = async (req, res) => {
    // Basic implementation for technician updates
    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addInternalNotes = async (req, res) => {
    try {
        const { note } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Not found' });
        ticket.workLog.push({ note, technician: req.user._id });
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addCustomerUpdate = async (req, res) => {
    try {
        const { text } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Not found' });
        ticket.comments.push({ user: req.user._id, text });
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.resolveTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Not found' });

        ticket.status = 'Resolved';
        ticket.resolvedAt = new Date();
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
