const Ticket = require('../models/Ticket');
const User = require('../models/User');

/**
 * @desc    Get tickets for admin reports with advanced filtering
 * @route   GET /api/admin/reports/tickets
 * @access  Private (Admin/Super Admin/System Admin)
 */
const getTicketsReport = async (req, res) => {
    try {
        const { technicianId, startDate, endDate, includeResolved } = req.query;

        // Build query
        const query = {};

        // Filter by technician
        if (technicianId && technicianId !== 'all') {
            query.technician = technicianId;
        } else {
            // Only include tickets that have been assigned to technicians
            query.technician = { $exists: true, $ne: null };
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Fetch tickets with populated fields
        const tickets = await Ticket.find(query)
            .populate('technician', 'name email')
            .populate('requester', 'name email department')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate technician breakdown if needed
        const technicianBreakdown = await calculateTechnicianBreakdown(tickets);

        res.json({
            tickets,
            technicianBreakdown,
            total: tickets.length
        });
    } catch (error) {
        console.error('[AdminReports] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Calculate performance breakdown by technician
 */
const calculateTechnicianBreakdown = async (tickets) => {
    const techMap = {};

    tickets.forEach(ticket => {
        const techId = ticket.technician?._id?.toString();
        const techName = ticket.technician?.name || 'Unassigned';

        if (!techId) return;

        if (!techMap[techId]) {
            techMap[techId] = {
                id: techId,
                name: techName,
                total: 0,
                resolved: 0,
                inProgress: 0,
                pending: 0,
                resolutionTimes: []
            };
        }

        techMap[techId].total++;

        if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
            techMap[techId].resolved++;
            
            // Calculate resolution time
            if (ticket.createdAt && ticket.updatedAt) {
                const resolutionTime = (new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
                techMap[techId].resolutionTimes.push(resolutionTime);
            }
        } else if (ticket.status === 'In Progress') {
            techMap[techId].inProgress++;
        } else {
            techMap[techId].pending++;
        }
    });

    // Calculate averages and format
    return Object.values(techMap).map(tech => {
        const avgResolutionTime = tech.resolutionTimes.length > 0
            ? (tech.resolutionTimes.reduce((a, b) => a + b, 0) / tech.resolutionTimes.length).toFixed(1)
            : '0';

        const resolutionRate = tech.total > 0
            ? ((tech.resolved / tech.total) * 100).toFixed(1)
            : '0';

        return {
            id: tech.id,
            name: tech.name,
            total: tech.total,
            resolved: tech.resolved,
            inProgress: tech.inProgress,
            pending: tech.pending,
            avgResolutionTime,
            resolutionRate
        };
    }).sort((a, b) => b.total - a.total); // Sort by total tickets descending
};

/**
 * @desc    Get comprehensive performance metrics for all technicians
 * @route   GET /api/admin/reports/performance
 * @access  Private (Admin/Super Admin/System Admin)
 */
const getPerformanceReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.createdAt.$lte = end;
            }
        }

        // Get all technicians
        const technicians = await User.find({ role: 'Technician' }).select('name email').lean();

        // Get performance data for each technician
        const performanceData = await Promise.all(
            technicians.map(async (tech) => {
                const query = { technician: tech._id, ...dateFilter };
                
                const allTickets = await Ticket.find(query).lean();
                const resolvedTickets = allTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
                
                // Calculate metrics
                let totalResolutionTime = 0;
                resolvedTickets.forEach(ticket => {
                    if (ticket.createdAt && ticket.updatedAt) {
                        totalResolutionTime += (new Date(ticket.updatedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
                    }
                });

                const avgResolutionTime = resolvedTickets.length > 0
                    ? (totalResolutionTime / resolvedTickets.length).toFixed(1)
                    : '0';

                const resolutionRate = allTickets.length > 0
                    ? ((resolvedTickets.length / allTickets.length) * 100).toFixed(1)
                    : '0';

                return {
                    technicianId: tech._id,
                    technicianName: tech.name,
                    technicianEmail: tech.email,
                    totalTickets: allTickets.length,
                    resolvedTickets: resolvedTickets.length,
                    inProgressTickets: allTickets.filter(t => t.status === 'In Progress').length,
                    pendingTickets: allTickets.filter(t => t.status === 'Assigned' || t.status === 'New').length,
                    avgResolutionTime,
                    resolutionRate
                };
            })
        );

        res.json({
            technicians: performanceData.sort((a, b) => b.totalTickets - a.totalTickets),
            totalTechnicians: technicians.length
        });
    } catch (error) {
        console.error('[PerformanceReport] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTicketsReport,
    getPerformanceReport
};
