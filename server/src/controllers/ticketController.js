const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { sendEmail, sendSMS } = require('../services/notificationService');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');
const { getMaxFileSizeBytes } = require('../utils/settingsCache');

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
// @access  Private (Employee)
exports.createTicket = async (req, res) => {
    try {
        const { title, description, category, priority, buildingWing, companyId } = req.body || {};
        if (!title || !description || !category || !priority) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const filesArray = Array.isArray(req.files)
            ? req.files
            : (req.files && req.files.attachments) ? req.files.attachments : [];
        let attachments = (filesArray || []).map((file) => ({
            filename: file.filename,
            path: `uploads/${file.filename}`,
            mimetype: file.mimetype,
        }));

        // Fallback: accept base64 image payloads for clients that can't send multipart reliably
        if (attachments.length === 0 && req.body?.imageData) {
            const path = require('path');
            const fs = require('fs');
            const uploadDir = path.join(__dirname, '..', '..', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const mime = req.body.imageMime || 'image/jpeg';
            const ext = mime.includes('/') ? mime.split('/')[1] : 'jpg';
            const safeName = String(req.body.imageName || 'attachment')
                .replace(/[^a-zA-Z0-9._-]/g, '_');
            const filename = `${Date.now()}-${safeName}.${ext}`;
            const filePath = path.join(uploadDir, filename);
            const rawData = String(req.body.imageData || '');
            const base64Data = rawData.includes(',') ? rawData.split(',')[1] : rawData;
            const buffer = Buffer.from(base64Data, 'base64');
            const maxSize = getMaxFileSizeBytes();
            if (buffer.length > maxSize) {
                return res.status(413).json({ message: 'Image exceeds maximum upload size' });
            }
            fs.writeFileSync(filePath, buffer);

            attachments = [{
                filename,
                path: `uploads/${filename}`,
                mimetype: mime,
            }];
        }

        const slaHoursByPriority = {
            Critical: 1,
            High: 4,
            Medium: 12,
            Low: 24,
        };
        const slaHours = slaHoursByPriority[priority] || 24;
        const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

        const ticket = await Ticket.create({
            title,
            description,
            category,
            priority,
            buildingWing,
            companyId: companyId || req.tenantId || req.user.companyId || 1,
            requester: req.user._id,
            department: req.user.department || 'General',
            attachments,
            slaDueAt,
            slaBreached: false,
        });

        await logAudit({
            action: 'TICKET_CREATE',
            req,
            targetUser: ticket.requester,
            metadata: {
                ticketId: ticket._id,
                companyId: ticket.companyId,
                priority: ticket.priority,
                category: ticket.category
            }
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
        console.error('Create ticket error:', error);
        res.status(500).json({ message: error.message || 'Failed to create ticket' });
    }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private (All authenticated users, filtered by role)
exports.getTickets = async (req, res) => {
    try {
        let query;
        const isGlobalAdmin = req.user.role === 'System Admin' || req.user.role === 'Super Admin';
        const companyScope = req.tenantId ?? (!isGlobalAdmin ? req.user.companyId : undefined);

        // Filter by role
        if (req.user.role === 'Employee') {
            const base = { requester: req.user._id };
            const scoped = req.tenantId ? { ...base, companyId: req.tenantId } : base;
            query = Ticket.find(scoped);
        } else if (req.user.role === 'Technician') {
            const base = { technician: req.user._id };
            const scoped = req.tenantId ? { ...base, companyId: req.tenantId } : base;
            query = Ticket.find(scoped);
        } else {
            const scoped = companyScope !== undefined ? { companyId: companyScope } : {};
            query = Ticket.find(scoped);
        }

        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const pageSize = Math.max(parseInt(req.query.pageSize || '20', 10), 1);

        const statusFilter = req.query.status;
        const reviewStatusFilter = req.query.reviewStatus;
        if (statusFilter) {
            query = query.where({ status: statusFilter });
        }
        if (reviewStatusFilter) {
            query = query.where({ reviewStatus: reviewStatusFilter });
        }
        if (req.query.onlyUnassigned === 'true') {
            query = query.where({
                $and: [
                    { $or: [{ status: 'New' }, { technician: { $exists: false } }, { technician: null }] },
                    { status: { $nin: ['Resolved', 'Closed'] } }
                ]
            });
        }

        const total = await Ticket.countDocuments(query.getQuery());

        const needsDetails = Boolean(reviewStatusFilter) || req.query.includeDetails === 'true';

        let ticketsQuery = query
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        if (needsDetails) {
            ticketsQuery = ticketsQuery
                .populate('technician', 'name email')
                .populate('requester', 'name email department');
        } else {
            ticketsQuery = ticketsQuery.select('title status priority companyId createdAt updatedAt reviewStatus slaDueAt slaBreached');
        }

        const tickets = await ticketsQuery.lean();

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
        if (req.user.role === 'Employee' && ticket.requester._id.toString() !== req.user._id.toString()) {
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

        await logAudit({
            action: 'TICKET_UPDATE',
            req,
            targetUser: ticket.requester,
            metadata: { ticketId: ticket._id, companyId: ticket.companyId }
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

        if (req.body.autoAssign === true) {
            const techs = await User.find({
                role: 'Technician',
                companyId: ticket.companyId
            }).lean();
            if (!techs.length) {
                return res.status(400).json({ message: 'No technicians available for auto-assign' });
            }

            const activeTickets = await Ticket.find({
                status: { $in: ['Assigned', 'In Progress'] },
                companyId: ticket.companyId
            }).select('technician status').lean();

            const scoreTech = (tech) => {
                const workload = activeTickets.filter(t =>
                    t.technician && String(t.technician) === String(tech._id)
                ).length;

                let score = 0;
                if (tech.isAvailable) score += 40;
                score += Math.max(0, 30 - workload * 5);
                if (tech.department === ticket.category || tech.department === 'IT Operations') score += 20;
                return score;
            };

            const sorted = techs
                .map(t => ({ tech: t, score: scoreTech(t) }))
                .sort((a, b) => b.score - a.score);

            if (sorted[0]) {
                ticket.technician = sorted[0].tech._id;
            } else {
                return res.status(400).json({ message: 'No eligible technicians for auto-assign' });
            }
        } else {
            if (!technicianId) {
                return res.status(400).json({ message: 'technicianId is required' });
            }
            ticket.technician = technicianId;
        }

        ticket.status = 'Assigned';
        await ticket.save();

        await AuditLog.create({
            action: 'TICKET_ASSIGN',
            performedBy: req.user._id,
            targetUser: ticket.technician,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
                ticketId: ticket._id,
                companyId: ticket.companyId,
                priority: ticket.priority,
                autoAssigned: req.body.autoAssign === true
            }
        });

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
                await sendSMS(tech.phone || '+1234567890', `URGENT: New Critical Ticket Assigned - ${ticket.title}`, { isCritical: true });
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

        await logAudit({
            action: 'TICKET_COMMENT',
            req,
            targetUser: ticket.requester,
            metadata: { ticketId: ticket._id, companyId: ticket.companyId }
        });

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
        ticket.slaBreached = ticket.slaDueAt ? new Date() > new Date(ticket.slaDueAt) : false;
        await ticket.save();

        await AuditLog.create({
            action: 'TICKET_RESOLVE',
            performedBy: req.user._id,
            targetUser: ticket.requester,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
                ticketId: ticket._id,
                companyId: ticket.companyId
            }
        });

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
        // Keep ticket in Resolved until admin approves
        ticket.status = 'Resolved';
        ticket.reviewStatus = 'Pending';
        await ticket.save();

        await logAudit({
            action: 'TICKET_RATE',
            req,
            targetUser: ticket.requester,
            metadata: { ticketId: ticket._id, companyId: ticket.companyId, rating }
        });

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review ticket resolution
// @route   PUT /api/tickets/:id/review
// @access  Private (Admin/Super Admin/System Admin)
exports.reviewTicket = async (req, res) => {
    try {
        const { action, notes } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (action !== 'approve' && action !== 'reject') {
            return res.status(400).json({ message: 'Invalid review action' });
        }

        if (action === 'approve') {
            ticket.reviewStatus = 'Approved';
            ticket.status = 'Closed';
        } else {
            ticket.reviewStatus = 'Rejected';
            ticket.status = ticket.technician ? 'Assigned' : 'New';
        }

        ticket.reviewNotes = notes || '';
        await ticket.save();

        await AuditLog.create({
            action: 'TICKET_REVIEW',
            performedBy: req.user._id,
            targetUser: ticket.requester,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
                ticketId: ticket._id,
                companyId: ticket.companyId,
                reviewStatus: ticket.reviewStatus
            }
        });

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

        await logAudit({
            action: 'TICKET_WORKLOG',
            req,
            targetUser: ticket.requester,
            metadata: { ticketId: ticket._id, companyId: ticket.companyId }
        });

        emitUpdate(req, 'ticket_updated', ticket);
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
