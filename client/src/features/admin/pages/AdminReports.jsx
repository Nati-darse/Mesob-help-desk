import { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button, Card, CardContent, Grid, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
    Chip, Paper, Divider, Alert, CircularProgress, Checkbox, FormControlLabel, Radio,
    RadioGroup, FormLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as AssessmentIcon,
    FilterList as FilterIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';
import { exportToExcel, exportToCSV, formatDate, formatDuration, calculateStats } from '../../../utils/excelExport';

const AdminReports = () => {
    const { user } = useAuth();
    const [reportDialog, setReportDialog] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [loadingTechs, setLoadingTechs] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    // Report Filters
    const [filters, setFilters] = useState({
        technicianFilter: 'all', // 'all' or specific technician ID
        timeFilter: 'month', // 'week', 'month', 'all', 'custom'
        startDate: '',
        endDate: '',
        includeStats: true,
        groupByTechnician: false
    });

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        setLoadingTechs(true);
        try {
            const { data } = await axios.get('/api/users/technicians');
            setTechnicians(data);
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoadingTechs(false);
        }
    };

    const getDateRange = () => {
        const now = new Date();
        let startDate, endDate;

        switch (filters.timeFilter) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'custom':
                startDate = filters.startDate ? new Date(filters.startDate) : null;
                endDate = filters.endDate ? new Date(filters.endDate) : null;
                break;
            case 'all':
            default:
                startDate = null;
                endDate = null;
        }

        return { startDate, endDate };
    };

    const generatePreview = async () => {
        setGeneratingReport(true);
        try {
            const { startDate, endDate } = getDateRange();
            
            const params = {
                includeResolved: true
            };

            if (startDate) params.startDate = startDate.toISOString().split('T')[0];
            if (endDate) params.endDate = endDate.toISOString().split('T')[0];
            if (filters.technicianFilter !== 'all') params.technicianId = filters.technicianFilter;

            const { data } = await axios.get('/api/admin/reports/tickets', { params });

            setPreviewData({
                tickets: data.tickets || [],
                stats: calculateStats(data.tickets || []),
                technicianBreakdown: data.technicianBreakdown || []
            });
        } catch (error) {
            console.error('Error generating preview:', error);
            alert('Failed to generate preview: ' + error.message);
        } finally {
            setGeneratingReport(false);
        }
    };

    const generateReport = async (format) => {
        if (!previewData) {
            await generatePreview();
            return;
        }

        setGeneratingReport(true);
        try {
            const { tickets, stats, technicianBreakdown } = previewData;

            if (tickets.length === 0) {
                alert('No tickets found for the selected filters');
                setGeneratingReport(false);
                return;
            }

            // Prepare export data
            let exportData = [];
            let headers = [];
            let title = '';
            let metadata = {};

            if (filters.groupByTechnician && technicianBreakdown.length > 0) {
                // Group by technician report
                title = 'Technician_Performance_Report';
                
                headers = [
                    { key: 'technician', label: 'Technician' },
                    { key: 'total', label: 'Total Tickets' },
                    { key: 'resolved', label: 'Resolved' },
                    { key: 'inProgress', label: 'In Progress' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'avgResolution', label: 'Avg Resolution (hrs)' },
                    { key: 'resolutionRate', label: 'Resolution Rate (%)' }
                ];

                exportData = technicianBreakdown.map((tech, index) => ({
                    '#': index + 1,
                    technician: tech.name,
                    total: tech.total,
                    resolved: tech.resolved,
                    inProgress: tech.inProgress,
                    pending: tech.pending,
                    avgResolution: tech.avgResolutionTime,
                    resolutionRate: tech.resolutionRate
                }));

                metadata = {
                    'Report Type': 'Technician Performance Summary',
                    'Generated By': user?.name || 'Admin',
                    'Generated On': new Date().toLocaleString(),
                    'Time Period': filters.timeFilter === 'custom' 
                        ? `${filters.startDate} to ${filters.endDate}`
                        : filters.timeFilter.charAt(0).toUpperCase() + filters.timeFilter.slice(1),
                    'Total Technicians': technicianBreakdown.length,
                    'Total Tickets': stats.total,
                    'Overall Resolution Rate': `${stats.resolutionRate}%`
                };
            } else {
                // Detailed ticket report
                const techName = filters.technicianFilter !== 'all' 
                    ? technicians.find(t => t._id === filters.technicianFilter)?.name || 'Unknown'
                    : 'All_Technicians';
                
                title = `Ticket_Report_${techName}`;

                headers = [
                    { key: '#', label: '#' },
                    { key: 'ticketId', label: 'Ticket ID' },
                    { key: 'title', label: 'Title' },
                    { key: 'technician', label: 'Technician' },
                    { key: 'category', label: 'Category' },
                    { key: 'priority', label: 'Priority' },
                    { key: 'status', label: 'Status' },
                    { key: 'company', label: 'Company ID' },
                    { key: 'department', label: 'Department' },
                    { key: 'created', label: 'Created Date' },
                    { key: 'updated', label: 'Last Updated' },
                    { key: 'duration', label: 'Duration' },
                    { key: 'rating', label: 'Rating' }
                ];

                exportData = tickets.map((ticket, index) => ({
                    '#': index + 1,
                    ticketId: ticket._id.slice(-8).toUpperCase(),
                    title: ticket.title,
                    technician: ticket.technician?.name || 'Unassigned',
                    category: ticket.category,
                    priority: ticket.priority,
                    status: ticket.status,
                    company: ticket.companyId,
                    department: ticket.department,
                    created: formatDate(ticket.createdAt),
                    updated: formatDate(ticket.updatedAt),
                    duration: formatDuration(ticket.createdAt, ticket.updatedAt),
                    rating: ticket.rating || 'N/A'
                }));

                metadata = {
                    'Report Type': 'Detailed Ticket Report',
                    'Generated By': user?.name || 'Admin',
                    'Generated On': new Date().toLocaleString(),
                    'Technician Filter': techName,
                    'Time Period': filters.timeFilter === 'custom' 
                        ? `${filters.startDate} to ${filters.endDate}`
                        : filters.timeFilter.charAt(0).toUpperCase() + filters.timeFilter.slice(1),
                    'Total Tickets': stats.total,
                    'Resolved': stats.resolved,
                    'In Progress': stats.inProgress,
                    'Pending': stats.pending,
                    'Avg Resolution Time': `${stats.avgResolutionTime} hours`,
                    'Resolution Rate': `${stats.resolutionRate}%`,
                    'Critical Priority': stats.priorities.Critical || 0,
                    'High Priority': stats.priorities.High || 0,
                    'Medium Priority': stats.priorities.Medium || 0,
                    'Low Priority': stats.priorities.Low || 0
                };
            }

            if (format === 'excel') {
                exportToExcel(exportData, headers, title, metadata);
            } else {
                exportToCSV(exportData, headers, title);
            }

            alert(`${format.toUpperCase()} report generated successfully!`);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report: ' + error.message);
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleOpenDialog = () => {
        setReportDialog(true);
        setPreviewData(null);
    };

    const handleCloseDialog = () => {
        setReportDialog(false);
        setPreviewData(null);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    📊 Admin Reports & Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Generate comprehensive reports with advanced filtering options
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={handleOpenDialog}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Technician Performance
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Generate detailed performance reports for individual or all technicians
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={handleOpenDialog}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Time-Based Analysis
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Analyze ticket trends by week, month, or custom date range
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={handleOpenDialog}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <FilterIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Custom Filters
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Apply advanced filters and export to Excel or CSV
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Report Generation Dialog */}
            <Dialog open={reportDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssessmentIcon />
                        Generate Admin Report
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Grid container spacing={3}>
                        {/* Technician Filter */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Technician</InputLabel>
                                <Select
                                    value={filters.technicianFilter}
                                    label="Technician"
                                    onChange={(e) => setFilters({ ...filters, technicianFilter: e.target.value })}
                                    startAdornment={<PersonIcon sx={{ mr: 1, color: 'action.active' }} />}
                                >
                                    <MenuItem value="all">
                                        <strong>All Technicians</strong>
                                    </MenuItem>
                                    <Divider />
                                    {technicians.map((tech) => (
                                        <MenuItem key={tech._id} value={tech._id}>
                                            {tech.name} ({tech.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Time Period Filter */}
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    <CalendarIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                                    Time Period
                                </FormLabel>
                                <RadioGroup
                                    value={filters.timeFilter}
                                    onChange={(e) => setFilters({ ...filters, timeFilter: e.target.value })}
                                >
                                    <FormControlLabel value="week" control={<Radio />} label="Last 7 Days" />
                                    <FormControlLabel value="month" control={<Radio />} label="Last 30 Days" />
                                    <FormControlLabel value="all" control={<Radio />} label="All Time" />
                                    <FormControlLabel value="custom" control={<Radio />} label="Custom Date Range" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        {/* Custom Date Range */}
                        {filters.timeFilter === 'custom' && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Start Date"
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="End Date"
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Report Options */}
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Report Options
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={filters.groupByTechnician}
                                            onChange={(e) => setFilters({ ...filters, groupByTechnician: e.target.checked })}
                                        />
                                    }
                                    label="Group by Technician (Summary Report)"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={filters.includeStats}
                                            onChange={(e) => setFilters({ ...filters, includeStats: e.target.checked })}
                                        />
                                    }
                                    label="Include Statistics"
                                />
                            </Paper>
                        </Grid>

                        {/* Preview Button */}
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={generatePreview}
                                disabled={generatingReport}
                                startIcon={generatingReport ? <CircularProgress size={20} /> : <FilterIcon />}
                            >
                                {generatingReport ? 'Loading Preview...' : 'Generate Preview'}
                            </Button>
                        </Grid>

                        {/* Preview Data */}
                        {previewData && (
                            <Grid item xs={12}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        Preview Ready
                                    </Typography>
                                    <Typography variant="body2">
                                        Found {previewData.tickets.length} tickets matching your filters
                                    </Typography>
                                </Alert>

                                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: 360 }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell><strong>Metric</strong></TableCell>
                                                <TableCell align="right"><strong>Value</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Total Tickets</TableCell>
                                                <TableCell align="right">{previewData.stats.total}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Resolved</TableCell>
                                                <TableCell align="right">
                                                    <Chip label={previewData.stats.resolved} color="success" size="small" />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>In Progress</TableCell>
                                                <TableCell align="right">
                                                    <Chip label={previewData.stats.inProgress} color="info" size="small" />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Pending</TableCell>
                                                <TableCell align="right">
                                                    <Chip label={previewData.stats.pending} color="warning" size="small" />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Avg Resolution Time</TableCell>
                                                <TableCell align="right">{previewData.stats.avgResolutionTime}h</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Resolution Rate</TableCell>
                                                <TableCell align="right">{previewData.stats.resolutionRate}%</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={handleCloseDialog} disabled={generatingReport}>
                        Cancel
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => generateReport('csv')}
                        startIcon={<DownloadIcon />}
                        disabled={generatingReport || !previewData}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => generateReport('excel')}
                        startIcon={<DownloadIcon />}
                        disabled={generatingReport || !previewData}
                        color="success"
                    >
                        {generatingReport ? 'Generating...' : 'Export Excel'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminReports;
