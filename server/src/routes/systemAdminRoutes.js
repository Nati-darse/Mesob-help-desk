const express = require('express');
const router = express.Router();
const {
    getSystemHealth,
    getStealthUserAudit,
    forceLogout,
    getCrossTenantAnalytics,
    exportCrossTenantAnalytics,
    globalTicketSearch,
    emergencyReassignTicket,
    getAuditLogs,
    bulkDataCleanup,
    createPrivilegedAccount,
    getPrivilegedAccounts,
    updatePrivilegedAccount,
    deletePrivilegedAccount
} = require('../controllers/systemAdminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require System Admin access
router.use(protect);
router.use(authorize('System Admin'));

// System Health & Monitoring
router.get('/health', getSystemHealth);

// User Management & Audit
router.get('/users/stealth-audit', getStealthUserAudit);
router.post('/force-logout', forceLogout);

// Analytics & Reporting
router.get('/analytics/cross-tenant', getCrossTenantAnalytics);
router.get('/analytics/export', exportCrossTenantAnalytics);
router.get('/audit-logs', getAuditLogs);

// Ticket Management
router.get('/tickets/global-search', globalTicketSearch);
router.put('/tickets/:id/emergency-reassign', emergencyReassignTicket);

// System Maintenance
router.post('/cleanup', bulkDataCleanup);

// Privileged Account Management
router.post('/create-account', createPrivilegedAccount);
router.get('/privileged-accounts', getPrivilegedAccounts);
router.put('/privileged-accounts/:id', updatePrivilegedAccount);
router.delete('/privileged-accounts/:id', deletePrivilegedAccount);

module.exports = router;