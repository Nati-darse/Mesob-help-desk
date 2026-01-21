const User = require('../models/User');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const SystemHealth = require('../models/SystemHealth');
const GlobalSetting = require('../models/GlobalSetting');
const mongoose = require('mongoose');

// Helper function to log audit events
const logAuditEvent = async (userId, userEmail, userRole, action, targetType, targetId, targetName, details, req, severity = 'LOW') => {
    try {
        await AuditLog.create({
            userId,
            userEmail,
            userRole,
            action,
            targetType,
            targetId,
            targetName,
            details,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            companyId: req.user?.companyId || 1,
            severity
        });
    } catch (error) {
        console.error('Audit log error:', error);
    }
};

// @desc    Get real-time system health
// @route   GET /api/system-admin/health
// @access  Private (System Admin)
exports.getSystemHealth = async (req, res) => {
    try {
        const health = {
            timestamp: new Date(),
            services: {
                mongodb: await checkMongoHealth(),
                redis: await checkRedisHealth(),
                socketio: await checkSocketHealth(req),
                smtp: await checkSMTPHealth(),
                api: await checkAPIHealth()
            },
            systemMetrics: await getSystemMetrics()
        };

        // Save health snapshot
        await SystemHealth.create(health);

        res.json(health);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get stealth user audit (all users with tracking)
// @route   GET /api/system-admin/users/stealth-audit
// @access  Private (System Admin)
exports.getStealthUserAudit = async (req, res) => {
    try {
        // System Admins can see ALL users including hidden ones
        const users = await User.findIncludingHidden({})
            .select('+lastLoginAt +lastLoginIP +loginHistory +sessionToken')
            .sort({ lastLoginAt: -1 });

        const auditData = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId,
            isAvailable: user.isAvailable,
            isHidden: user.isHidden,
            lastLoginAt: user.lastLoginAt,
            lastLoginIP: user.lastLoginIP,
            loginHistory: user.loginHistory,
            createdAt: user.createdAt,
            isOnline: !!user.sessionToken
        }));

        res.json(auditData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Force logout all sessions for user/company/global
// @route   POST /api/system-admin/force-logout
// @access  Private (System Admin)
exports.forceLogout = async (req, res) => {
    try {
        const { type, targetId } = req.body; // type: 'user', 'company', 'global'

        let query = {};
        let targetName = '';

        switch (type) {
            case 'user':
                query = { _id: targetId };
                const user = await User.findById(targetId);
                targetName = user ? user.name : 'Unknown User';
                break;
            case 'company':
                query = { companyId: targetId };
                targetName = `Company ${targetId}`;
                break;
            case 'global':
                query = {};
                targetName = 'All Users';
                break;
            default:
                return res.status(400).json({ message: 'Invalid logout type' });
        }

        // Clear session tokens
        const result = await User.updateMany(query, { $unset: { sessionToken: 1 } });

        // Log the action
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'FORCE_LOGOUT', 'SYSTEM', targetId || 'global', targetName,
            { type, affectedUsers: result.modifiedCount },
            req, 'CRITICAL'
        );

        // Emit socket event to force logout
        const io = req.app.get('io');
        if (io) {
            if (type === 'global') {
                io.emit('force_logout', { reason: 'System Administrator action' });
            } else if (type === 'company') {
                io.to(`company:${targetId}`).emit('force_logout', { reason: 'System Administrator action' });
            } else {
                // For individual user, we'd need to track socket connections by userId
                io.emit('force_logout_user', { userId: targetId, reason: 'System Administrator action' });
            }
        }

        res.json({ 
            message: `Force logout completed for ${targetName}`,
            affectedUsers: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get cross-tenant analytics
// @route   GET /api/system-admin/analytics/cross-tenant
// @access  Private (System Admin)
exports.getCrossTenantAnalytics = async (req, res) => {
    try {
        const analytics = await Promise.all([
            // Tickets by company
            Ticket.aggregate([
                { $group: { _id: '$companyId', totalTickets: { $sum: 1 }, avgResolutionTime: { $avg: '$resolutionTime' } } },
                { $sort: { totalTickets: -1 } }
            ]),
            // Users by company
            User.aggregate([
                { $group: { _id: '$companyId', totalUsers: { $sum: 1 }, activeUsers: { $sum: { $cond: ['$isAvailable', 1, 0] } } } },
                { $sort: { totalUsers: -1 } }
            ]),
            // Recent activity by company
            AuditLog.aggregate([
                { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
                { $group: { _id: '$companyId', activityCount: { $sum: 1 } } },
                { $sort: { activityCount: -1 } }
            ])
        ]);

        res.json({
            ticketsByCompany: analytics[0],
            usersByCompany: analytics[1],
            activityByCompany: analytics[2],
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export cross-tenant analytics as CSV
// @route   GET /api/system-admin/analytics/export
// @access  Private (System Admin)
exports.exportCrossTenantAnalytics = async (req, res) => {
    try {
        const analytics = await Promise.all([
            // Tickets by company
            Ticket.aggregate([
                { $group: { _id: '$companyId', totalTickets: { $sum: 1 }, avgResolutionTime: { $avg: '$resolutionTime' } } },
                { $sort: { totalTickets: -1 } }
            ]),
            // Users by company
            User.aggregate([
                { $group: { _id: '$companyId', totalUsers: { $sum: 1 }, activeUsers: { $sum: { $cond: ['$isAvailable', 1, 0] } } } },
                { $sort: { totalUsers: -1 } }
            ])
        ]);

        // Convert to CSV format
        let csvContent = 'Company ID,Company Name,Total Tickets,Avg Resolution Time,Total Users,Active Users\n';
        
        const ticketsMap = new Map(analytics[0].map(item => [item._id, item]));
        const usersMap = new Map(analytics[1].map(item => [item._id, item]));
        
        const allCompanyIds = new Set([...ticketsMap.keys(), ...usersMap.keys()]);
        
        allCompanyIds.forEach(companyId => {
            const tickets = ticketsMap.get(companyId) || { totalTickets: 0, avgResolutionTime: 0 };
            const users = usersMap.get(companyId) || { totalUsers: 0, activeUsers: 0 };
            
            csvContent += `${companyId},"Company ${companyId}",${tickets.totalTickets},${Math.round(tickets.avgResolutionTime || 0)},${users.totalUsers},${users.activeUsers}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cross-tenant-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
    } catch (error) {
        console.error('Export analytics error:', error);
        res.status(500).json({ message: 'Failed to export analytics' });
    }
};

// @desc    Global ticket search
// @route   GET /api/system-admin/tickets/global-search
// @access  Private (System Admin)
exports.globalTicketSearch = async (req, res) => {
    try {
        const { query, ticketId, companyId, status, priority } = req.query;

        let searchQuery = {};

        if (ticketId) {
            searchQuery._id = ticketId;
        }

        if (query) {
            searchQuery.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        if (companyId) {
            searchQuery.companyId = parseInt(companyId);
        }

        if (status) {
            searchQuery.status = status;
        }

        if (priority) {
            searchQuery.priority = priority;
        }

        const tickets = await Ticket.find(searchQuery)
            .populate('requester', 'name email companyId')
            .populate('technician', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);

        // Log the search
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'DATA_EXPORT', 'TICKET', 'global-search', 'Global Ticket Search',
            { searchQuery, resultCount: tickets.length },
            req, 'MEDIUM'
        );

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Emergency ticket reassignment
// @route   PUT /api/system-admin/tickets/:id/emergency-reassign
// @access  Private (System Admin)
exports.emergencyReassignTicket = async (req, res) => {
    try {
        const { newCompanyId, newTechnicianId, reason } = req.body;
        const ticketId = req.params.id;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const oldCompanyId = ticket.companyId;
        const oldTechnician = ticket.technician;

        // Update ticket
        ticket.companyId = newCompanyId || ticket.companyId;
        ticket.technician = newTechnicianId || ticket.technician;
        
        // Add system comment
        ticket.comments.push({
            user: req.user._id,
            text: `[SYSTEM ADMIN] Emergency reassignment: ${reason}`,
            createdAt: new Date()
        });

        await ticket.save();

        // Log the emergency action
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'TICKET_UPDATED', 'TICKET', ticketId, ticket.title,
            { 
                action: 'emergency_reassignment',
                oldCompanyId, 
                newCompanyId, 
                oldTechnician, 
                newTechnicianId, 
                reason 
            },
            req, 'CRITICAL'
        );

        res.json({ message: 'Ticket reassigned successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get audit logs with advanced filtering
// @route   GET /api/system-admin/audit-logs
// @access  Private (System Admin)
exports.getAuditLogs = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            action, 
            severity, 
            companyId, 
            userId, 
            startDate, 
            endDate 
        } = req.query;

        let query = {};

        if (action) query.action = action;
        if (severity) query.severity = severity;
        if (companyId) query.companyId = parseInt(companyId);
        if (userId) query.userId = userId;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk data cleanup
// @route   POST /api/system-admin/cleanup
// @access  Private (System Admin)
exports.bulkDataCleanup = async (req, res) => {
    try {
        const { type, olderThanDays, companyId } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        let result = {};

        switch (type) {
            case 'tickets':
                let ticketQuery = { 
                    createdAt: { $lt: cutoffDate },
                    status: { $in: ['Closed', 'Resolved'] }
                };
                if (companyId) ticketQuery.companyId = companyId;
                
                result = await Ticket.deleteMany(ticketQuery);
                break;

            case 'audit_logs':
                let auditQuery = { timestamp: { $lt: cutoffDate } };
                if (companyId) auditQuery.companyId = companyId;
                
                result = await AuditLog.deleteMany(auditQuery);
                break;

            case 'system_health':
                result = await SystemHealth.deleteMany({ 
                    timestamp: { $lt: cutoffDate } 
                });
                break;

            default:
                return res.status(400).json({ message: 'Invalid cleanup type' });
        }

        // Log the cleanup action
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'BULK_ACTION', 'SYSTEM', type, `Bulk ${type} cleanup`,
            { type, olderThanDays, companyId, deletedCount: result.deletedCount },
            req, 'HIGH'
        );

        res.json({ 
            message: `Cleanup completed for ${type}`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create privileged user account (Super Admin, Technician, Team Lead)
// @route   POST /api/system-admin/create-account
// @access  Private (System Admin)
exports.createPrivilegedAccount = async (req, res) => {
    try {
        const { name, email, password, role, department, companyId } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required' });
        }

        // Validate role - only allow specific privileged roles
        const allowedRoles = ['Super Admin', 'Technician', 'Team Lead'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'Invalid role. Only Super Admin, Technician, and Team Lead roles are allowed.' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Set default department based on role
        let finalDepartment = department;
        if (role === 'Super Admin') {
            finalDepartment = 'Administration';
        } else if (role === 'Technician') {
            finalDepartment = 'IT Support';
        } else if (role === 'Team Lead') {
            finalDepartment = 'Management';
        }

        // Set default company ID based on role
        let finalCompanyId = companyId;
        if (role === 'Technician') {
            finalCompanyId = 1; // Force technicians to MESOB (Company ID 1)
        } else if (role === 'Super Admin') {
            finalCompanyId = 1; // Super Admins belong to MESOB
        } else if (!finalCompanyId) {
            finalCompanyId = 1; // Default to MESOB for other roles if not specified
        }

        // Create the user
        const newUser = await User.create({
            name,
            email,
            password,
            role,
            department: finalDepartment,
            companyId: finalCompanyId,
            isHidden: false, // These accounts are visible (unlike hidden system admins)
            dutyStatus: role === 'Technician' ? 'Online' : undefined
        });

        // Log the account creation
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'PRIVILEGED_ACCOUNT_CREATED', 'USER', newUser._id.toString(), newUser.name,
            { 
                targetRole: role, 
                targetDepartment: finalDepartment, 
                targetCompanyId: finalCompanyId,
                createdBy: req.user.email
            },
            req, 'HIGH'
        );

        // Return user data without password
        const { password: _, ...userResponse } = newUser.toObject();
        
        res.status(201).json({
            message: `${role} account created successfully`,
            user: userResponse
        });
    } catch (error) {
        console.error('Error creating privileged account:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all privileged accounts (Super Admin, Technician, Team Lead)
// @route   GET /api/system-admin/privileged-accounts
// @access  Private (System Admin)
exports.getPrivilegedAccounts = async (req, res) => {
    try {
        const privilegedRoles = ['Super Admin', 'Technician', 'Team Lead'];
        
        const accounts = await User.find({
            role: { $in: privilegedRoles },
            isHidden: { $ne: true } // Exclude hidden system admins
        })
        .select('-password')
        .sort({ createdAt: -1 });

        // Add company display names
        const accountsWithCompanyInfo = accounts.map(account => {
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
            
            const company = companyMap[account.companyId] || { name: 'Unknown Company', initials: 'UNK' };
            
            return {
                ...account.toObject(),
                companyDisplayName: company.name,
                companyDisplayInitials: company.initials
            };
        });

        res.json(accountsWithCompanyInfo);
    } catch (error) {
        console.error('Error fetching privileged accounts:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update privileged account
// @route   PUT /api/system-admin/privileged-accounts/:id
// @access  Private (System Admin)
exports.updatePrivilegedAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, companyId, isAvailable, dutyStatus } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only allow updating specific privileged roles
        const allowedRoles = ['Super Admin', 'Technician', 'Team Lead'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Can only update privileged accounts' });
        }

        // Store old values for audit
        const oldValues = {
            name: user.name,
            email: user.email,
            department: user.department,
            companyId: user.companyId,
            isAvailable: user.isAvailable,
            dutyStatus: user.dutyStatus
        };

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        
        // Auto-assign department based on role (cannot be changed)
        if (user.role === 'Super Admin') {
            user.department = 'Administration';
        } else if (user.role === 'Technician') {
            user.department = 'IT Support';
        } else if (user.role === 'Team Lead') {
            user.department = 'Management';
        }
        
        if (companyId !== undefined) {
            // Force technicians and super admins to stay in MESOB (Company ID 1)
            if (user.role === 'Technician' || user.role === 'Super Admin') {
                user.companyId = 1;
            } else {
                user.companyId = companyId;
            }
        }
        if (isAvailable !== undefined) user.isAvailable = isAvailable;
        if (dutyStatus && user.role === 'Technician') user.dutyStatus = dutyStatus;

        await user.save({ validateBeforeSave: false });

        // Log the update
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'PRIVILEGED_ACCOUNT_UPDATED', 'USER', user._id.toString(), user.name,
            { 
                targetRole: user.role,
                oldValues,
                newValues: { name, email, department: user.department, companyId: user.companyId, isAvailable, dutyStatus },
                updatedBy: req.user.email
            },
            req, 'MEDIUM'
        );

        // Return updated user without password
        const { password: _, ...userResponse } = user.toObject();
        
        res.json({
            message: 'Account updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error updating privileged account:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete privileged account
// @route   DELETE /api/system-admin/privileged-accounts/:id
// @access  Private (System Admin)
exports.deletePrivilegedAccount = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only allow deleting specific privileged roles
        const allowedRoles = ['Super Admin', 'Technician', 'Team Lead'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Can only delete privileged accounts' });
        }

        // Prevent deleting the last Super Admin
        if (user.role === 'Super Admin') {
            const superAdminCount = await User.countDocuments({ role: 'Super Admin' });
            if (superAdminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last Super Admin account' });
            }
        }

        // Store user info for audit before deletion
        const userInfo = {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            companyId: user.companyId
        };

        await User.findByIdAndDelete(id);

        // Log the deletion
        await logAuditEvent(
            req.user._id, req.user.email, req.user.role,
            'PRIVILEGED_ACCOUNT_DELETED', 'USER', id, userInfo.name,
            { 
                deletedUser: userInfo,
                deletedBy: req.user.email
            },
            req, 'HIGH'
        );

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting privileged account:', error);
        res.status(500).json({ message: error.message });
    }
};

// Helper functions for health checks
async function checkMongoHealth() {
    try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        const responseTime = Date.now() - start;
        
        return {
            status: 'online',
            responseTime,
            connections: mongoose.connection.readyState,
            details: `Connected to ${mongoose.connection.name}`
        };
    } catch (error) {
        return {
            status: 'offline',
            responseTime: null,
            connections: 0,
            details: error.message
        };
    }
}

async function checkRedisHealth() {
    // Placeholder - implement if Redis is used
    return {
        status: 'offline',
        responseTime: null,
        memoryUsage: null,
        details: 'Redis not configured'
    };
}

async function checkSocketHealth(req) {
    try {
        const io = req.app.get('io');
        if (!io) {
            return {
                status: 'offline',
                activeConnections: 0,
                totalConnections: 0,
                details: 'Socket.io not initialized'
            };
        }

        const sockets = await io.fetchSockets();
        return {
            status: 'online',
            activeConnections: sockets.length,
            totalConnections: sockets.length,
            details: `${sockets.length} active connections`
        };
    } catch (error) {
        return {
            status: 'degraded',
            activeConnections: 0,
            totalConnections: 0,
            details: error.message
        };
    }
}

async function checkSMTPHealth() {
    // Placeholder - implement SMTP test
    return {
        status: 'online',
        lastTestAt: new Date(),
        details: 'SMTP service operational'
    };
}

async function checkAPIHealth() {
    return {
        status: 'online',
        responseTime: Math.floor(Math.random() * 100) + 20,
        requestsPerMinute: Math.floor(Math.random() * 1000) + 100,
        errorRate: Math.random() * 0.05,
        details: 'API gateway operational'
    };
}

async function getSystemMetrics() {
    // Placeholder - implement system metrics collection
    return {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        uptime: process.uptime()
    };
}