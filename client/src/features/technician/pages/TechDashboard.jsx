import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Card, CardContent, FormControl, Select, MenuItem,
    CircularProgress, Grid, Chip, Alert, Snackbar, Badge, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Paper, Divider
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Assignment as AssignmentIcon,
    Dashboard as DashboardIcon,
    Notifications as NotificationsIcon,
    Download as DownloadIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { exportToExcel, exportToCSV, formatDate, formatDuration, calculateStats } from '../../../utils/excelExport';
import { useTranslation } from 'react-i18next';

const TechDashboard = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [dutyStatus, setDutyStatus] = useState('Online');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const [reportDialog, setReportDialog] = useState(false);
    const [reportDateRange, setReportDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [generatingReport, setGeneratingReport] = useState(false);

    // React Query for Real-time Data
    const { data: assignedTickets = [], isLoading: ticketsLoading } = useQuery({
        queryKey: ['tickets'],
        queryFn: async () => {
            const { data } = await axios.get('/api/technician/assigned');
            return data;
        },
        refetchInterval: 15000 // Fallback polling
    });

    const { data: performance, isLoading: perfLoading } = useQuery({
        queryKey: ['tech-performance'],
        queryFn: async () => {
            const { data } = await axios.get('/api/technician/performance');
            return data;
        },
        refetchInterval: 60000
    });

    const loading = ticketsLoading || perfLoading;

    useEffect(() => {
        if (user) {
            setDutyStatus(user.dutyStatus || 'Online');
        }
    }, [user]);

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    const handleDutyStatusChange = async (newStatus) => {
        setStatusUpdating(true);
        try {
            const response = await axios.put('/api/technician/duty-status', { dutyStatus: newStatus });
            setDutyStatus(newStatus);

            // Update user in global context and sessionStorage
            if (user) {
                updateUser({ dutyStatus: newStatus });
            }

            showNotification(t('techDashboard.dutyStatusUpdated', { status: newStatus }), 'success');
        } catch (error) {
            console.error('Error updating duty status:', error);
            if (error.response?.status !== 401) {
                showNotification(t('techDashboard.failedToUpdateStatus', { error: error.response?.data?.message || error.message }), 'error');
            }
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleOpenMissionControl = () => {
        navigate('/tech/mission-control');
    };

    const handleViewAllTickets = () => {
        navigate('/tickets');
    };

    const handleRefreshDashboard = () => {
        // Invalidate queries to force refetch
        qc.invalidateQueries({ queryKey: ['tickets'] });
        qc.invalidateQueries({ queryKey: ['tech-performance'] });
        showNotification(t('techDashboard.dashboardRefreshing'), 'info');
    };

    const qc = useQueryClient();

    // Report Generation Functions
    const handleOpenReportDialog = () => {
        setReportDialog(true);
    };

    const handleCloseReportDialog = () => {
        setReportDialog(false);
    };

    const generateReport = async (format) => {
        setGeneratingReport(true);
        try {
            // Fetch all tickets for the date range
            const response = await axios.get('/api/technician/assigned', {
                params: {
                    startDate: reportDateRange.startDate,
                    endDate: reportDateRange.endDate,
                    includeResolved: true
                }
            });

            const tickets = response.data;

            if (tickets.length === 0) {
                showNotification(t('techDashboard.noTicketsFound'), 'warning');
                setGeneratingReport(false);
                return;
            }

            // Calculate statistics
            const stats = calculateStats(tickets);

            // Prepare data for export
            const exportData = tickets.map((ticket, index) => ({
                '#': index + 1,
                'Ticket ID': ticket._id.slice(-8).toUpperCase(),
                'Title': ticket.title,
                'Category': ticket.category,
                'Priority': ticket.priority,
                'Status': ticket.status,
                'Company': ticket.companyId,
                'Department': ticket.department,
                'Created': formatDate(ticket.createdAt),
                'Updated': formatDate(ticket.updatedAt),
                'Duration': formatDuration(ticket.createdAt, ticket.updatedAt),
                'Rating': ticket.rating || 'N/A'
            }));

            const headers = [
                { key: '#', label: '#' },
                { key: 'Ticket ID', label: 'Ticket ID' },
                { key: 'Title', label: 'Title' },
                { key: 'Category', label: 'Category' },
                { key: 'Priority', label: 'Priority' },
                { key: 'Status', label: 'Status' },
                { key: 'Company', label: 'Company' },
                { key: 'Department', label: 'Department' },
                { key: 'Created', label: 'Created Date' },
                { key: 'Updated', label: 'Last Updated' },
                { key: 'Duration', label: 'Duration' },
                { key: 'Rating', label: 'Rating' }
            ];

            const metadata = {
                'Technician': user?.name || 'Unknown',
                'Report Period': `${reportDateRange.startDate} to ${reportDateRange.endDate}`,
                'Generated On': new Date().toLocaleString(),
                'Total Tickets': stats.total,
                'Resolved': stats.resolved,
                'In Progress': stats.inProgress,
                'Pending': stats.pending,
                'Avg Resolution Time': `${stats.avgResolutionTime} hours`,
                'Resolution Rate': `${stats.resolutionRate}%`
            };

            const title = `Technician_Report_${user?.name?.replace(/\s+/g, '_')}`;

            if (format === 'excel') {
                exportToExcel(exportData, headers, title, metadata);
                showNotification(t('techDashboard.excelReportGenerated'), 'success');
            } else {
                exportToCSV(exportData, headers, title);
                showNotification(t('techDashboard.csvReportGenerated'), 'success');
            }

            handleCloseReportDialog();
        } catch (error) {
            console.error('Error generating report:', error);
            showNotification(t('techDashboard.failedToGenerateReport', { error: error.message }), 'error');
        } finally {
            setGeneratingReport(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Online': return 'success';
            case 'On-Site': return 'primary';
            case 'Break': return 'warning';
            case 'Offline': return 'error';
            default: return 'default';
        }
    };

    const getUrgentTicketsCount = () => {
        return assignedTickets.filter(ticket =>
            ticket.priority === 'High' || ticket.priority === 'Critical'
        ).length;
    };

    const getPendingTicketsCount = () => {
        return assignedTickets.filter(ticket =>
            ticket.status === 'Open' || ticket.status === 'In Progress'
        ).length;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                    {t('techDashboard.workspace')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('techDashboard.welcome', { name: user?.name || t('roles.technician') })}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('techDashboard.liveUpdatesActive')}
                </Typography>
            </Box>

            {/* Current Duty Status Card - Enhanced */}
            <Card sx={{
                mb: 4,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                color: 'white',
                borderRadius: 3,
                position: 'relative',
                overflow: 'visible'
            }}>
                <CardContent sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                {t('techDashboard.currentDutyStatus')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                    label={dutyStatus}
                                    color={getStatusColor(dutyStatus)}
                                    size="large"
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        px: 2,
                                        py: 1
                                    }}
                                />
                                {getPendingTicketsCount() > 0 && (
                                    <Badge
                                        badgeContent={getPendingTicketsCount()}
                                        color="error"
                                        sx={{ ml: 2 }}
                                    >
                                        <Chip
                                            icon={<NotificationsIcon />}
                                            label={t('techDashboard.pendingTickets', { count: getPendingTicketsCount() })}
                                            variant="outlined"
                                            sx={{
                                                color: 'white',
                                                borderColor: 'rgba(255,255,255,0.5)',
                                                '& .MuiChip-icon': { color: 'white' }
                                            }}
                                        />
                                    </Badge>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                {t('techDashboard.changeStatus')}
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                                <Select
                                    value={dutyStatus}
                                    onChange={(e) => handleDutyStatusChange(e.target.value)}
                                    disabled={statusUpdating}
                                    sx={{
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                                        '& .MuiSvgIcon-root': { color: 'white' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                        '&.Mui-disabled': {
                                            color: 'rgba(255,255,255,0.6)',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
                                        }
                                    }}
                                    displayEmpty
                                >
                                    <MenuItem value="Online">{t('techDashboard.onlineAvailable')}</MenuItem>
                                    <MenuItem value="On-Site">{t('techDashboard.onSiteBusy')}</MenuItem>
                                    <MenuItem value="Break">{t('techDashboard.breakUnavailable')}</MenuItem>
                                    <MenuItem value="Offline">{t('techDashboard.offline')}</MenuItem>
                                </Select>
                                {statusUpdating && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                            {t('techDashboard.updatingStatus')}
                                        </Typography>
                                    </Box>
                                )}
                            </FormControl>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* My Efficiency Dashboard - Enhanced */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    {t('techDashboard.myEfficiencyDashboard')}
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, textAlign: 'center', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                                {performance?.avgResponseTime || '0'}h
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                {t('techDashboard.avgResponseTime')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ({performance?.responseTimeCount || 0} {t('tickets.tickets')})
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, textAlign: 'center', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#2e7d32', mb: 1 }}>
                                {performance?.avgResolutionTime || '0'}h
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                {t('techDashboard.avgResolutionTime')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ({performance?.resolutionTimeCount || 0} {t('tickets.tickets')})
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, textAlign: 'center', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#ed6c02', mb: 1 }}>
                                {performance?.todayResolved || 0}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                {t('techDashboard.resolvedToday')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('techDashboard.greatWork')}
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 2, textAlign: 'center', height: '100%', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#0288d1', mb: 1 }}>
                                {performance?.totalResolved || 0}/{performance?.totalAssigned || 0}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                {t('techDashboard.totalResolved')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {performance?.totalAssigned > 0 ?
                                    t('techDashboard.completion', { percent: Math.round((performance?.totalResolved || 0) / performance?.totalAssigned * 100) }) :
                                    t('techDashboard.noTicketsAssigned')
                                }
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* Quick Stats */}
            {assignedTickets.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        {t('techDashboard.quickOverview')}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Alert
                                severity={getUrgentTicketsCount() > 0 ? "error" : "success"}
                                sx={{ height: '100%' }}
                            >
                                <Typography variant="body2" fontWeight="600">
                                    {t('techDashboard.urgentTickets', { count: getUrgentTicketsCount() })}
                                </Typography>
                                <Typography variant="caption">
                                    {getUrgentTicketsCount() > 0 ? t('techDashboard.requiresAttention') : t('techDashboard.allCaughtUp')}
                                </Typography>
                            </Alert>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Alert severity="info" sx={{ height: '100%' }}>
                                <Typography variant="body2" fontWeight="600">
                                    {t('techDashboard.pendingTickets', { count: getPendingTicketsCount() })}
                                </Typography>
                                <Typography variant="caption">
                                    {t('techDashboard.activeWorkInProgress')}
                                </Typography>
                            </Alert>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Alert severity="warning" sx={{ height: '100%' }}>
                                <Typography variant="body2" fontWeight="600">
                                    {t('status.status')}: {dutyStatus}
                                </Typography>
                                <Typography variant="caption">
                                    {t('techDashboard.currentAvailability')}
                                </Typography>
                            </Alert>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Action Buttons - Enhanced */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 4 }}>
                <Tooltip title={t('techDashboard.accessAdvancedTools')}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleOpenMissionControl}
                        startIcon={<DashboardIcon />}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: { xs: '100%', sm: 200 }
                        }}
                    >
                        {t('techDashboard.openMissionControl')}
                    </Button>
                </Tooltip>

                <Tooltip title={t('techDashboard.viewAllAssignedTickets')}>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={handleViewAllTickets}
                        startIcon={<AssignmentIcon />}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: { xs: '100%', sm: 200 }
                        }}
                    >
                        {t('techDashboard.viewAllTickets')}
                    </Button>
                </Tooltip>

                <Tooltip title={t('techDashboard.refreshDashboardData')}>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={handleRefreshDashboard}
                        startIcon={<RefreshIcon />}
                        disabled={loading}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: { xs: '100%', sm: 200 }
                        }}
                    >
                        {loading ? t('techDashboard.refreshing') : t('techDashboard.refreshDashboard')}
                    </Button>
                </Tooltip>

                <Tooltip title={t('techDashboard.generateExportReports')}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleOpenReportDialog}
                        startIcon={<AssessmentIcon />}
                        color="success"
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            minWidth: { xs: '100%', sm: 200 }
                        }}
                    >
                        {t('techDashboard.generateReport')}
                    </Button>
                </Tooltip>
            </Box>

            {/* Report Generation Dialog */}
            <Dialog open={reportDialog} onClose={handleCloseReportDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssessmentIcon />
                        {t('techDashboard.generatePerformanceReport')}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('techDashboard.selectDateRange')}
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={t('reports.startDate')}
                                type="date"
                                value={reportDateRange.startDate}
                                onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label={t('reports.endDate')}
                                type="date"
                                value={reportDateRange.endDate}
                                onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>

                    <Paper
                        elevation={0}
                        sx={{
                            mt: 3,
                            p: 2,
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.action.hover : 'grey.50',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {t('techDashboard.reportWillInclude')}
                        </Typography>
                        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                            <Typography component="li" variant="body2">{t('techDashboard.allTicketsAssigned')}</Typography>
                            <Typography component="li" variant="body2">{t('techDashboard.performanceMetrics')}</Typography>
                            <Typography component="li" variant="body2">{t('techDashboard.resolutionTimes')}</Typography>
                            <Typography component="li" variant="body2">{t('techDashboard.priorityBreakdown')}</Typography>
                        </Box>
                    </Paper>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseReportDialog} disabled={generatingReport}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => generateReport('csv')}
                        startIcon={<DownloadIcon />}
                        disabled={generatingReport}
                    >
                        {t('techDashboard.exportCSV')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => generateReport('excel')}
                        startIcon={<DownloadIcon />}
                        disabled={generatingReport}
                        color="success"
                    >
                        {generatingReport ? t('techDashboard.generating') : t('techDashboard.exportExcel')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TechDashboard;
