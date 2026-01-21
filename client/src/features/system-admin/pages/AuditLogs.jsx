import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, TextField, MenuItem, Chip, List, ListItem, ListItemAvatar, 
    Avatar, ListItemText, Divider, IconButton, Grid, FormControl, InputLabel, Select,
    Pagination, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, Tooltip
} from '@mui/material';
import {
    History as HistoryIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FilterList as FilterIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    CheckCircle as SuccessIcon,
    Search as SearchIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getCompanyById } from '../../../utils/companies';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        severity: '',
        companyId: '',
        userId: '',
        startDate: '',
        endDate: ''
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailsDialog, setDetailsDialog] = useState(false);

    useEffect(() => {
        fetchAuditLogs();
    }, [page, filters]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            const response = await axios.get(`/api/system-admin/audit-logs?${params}`);
            setLogs(response.data.logs);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(1); // Reset to first page when filtering
    };

    const exportLogs = async () => {
        try {
            const params = new URLSearchParams({
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
                format: 'csv'
            });
            
            const response = await axios.get(`/api/system-admin/audit-logs/export?${params}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getIcon = (severity) => {
        switch (severity) {
            case 'CRITICAL': return <ErrorIcon color="error" />;
            case 'HIGH': return <WarningIcon color="warning" />;
            case 'MEDIUM': return <InfoIcon color="info" />;
            case 'LOW': return <SuccessIcon color="success" />;
            default: return <HistoryIcon color="action" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Box maxWidth="1400px" margin="0 auto">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                        🔍 Immutable Audit Trail
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Complete system activity log with advanced filtering and export capabilities
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchAuditLogs}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={exportLogs}
                        color="secondary"
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            {/* Advanced Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Action</InputLabel>
                            <Select
                                value={filters.action}
                                label="Action"
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                            >
                                <MenuItem value="">All Actions</MenuItem>
                                <MenuItem value="LOGIN">Login</MenuItem>
                                <MenuItem value="LOGOUT">Logout</MenuItem>
                                <MenuItem value="LOGIN_FAILED">Failed Login</MenuItem>
                                <MenuItem value="USER_CREATED">User Created</MenuItem>
                                <MenuItem value="USER_UPDATED">User Updated</MenuItem>
                                <MenuItem value="ROLE_CHANGED">Role Changed</MenuItem>
                                <MenuItem value="TICKET_CREATED">Ticket Created</MenuItem>
                                <MenuItem value="TICKET_UPDATED">Ticket Updated</MenuItem>
                                <MenuItem value="FORCE_LOGOUT">Force Logout</MenuItem>
                                <MenuItem value="BULK_ACTION">Bulk Action</MenuItem>
                                <MenuItem value="DATA_EXPORT">Data Export</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Severity</InputLabel>
                            <Select
                                value={filters.severity}
                                label="Severity"
                                onChange={(e) => handleFilterChange('severity', e.target.value)}
                            >
                                <MenuItem value="">All Levels</MenuItem>
                                <MenuItem value="LOW">Low</MenuItem>
                                <MenuItem value="MEDIUM">Medium</MenuItem>
                                <MenuItem value="HIGH">High</MenuItem>
                                <MenuItem value="CRITICAL">Critical</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Company ID"
                            value={filters.companyId}
                            onChange={(e) => handleFilterChange('companyId', e.target.value)}
                            type="number"
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Start Date"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            label="End Date"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => {
                                setFilters({
                                    action: '',
                                    severity: '',
                                    companyId: '',
                                    userId: '',
                                    startDate: '',
                                    endDate: ''
                                });
                                setPage(1);
                            }}
                        >
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Audit Logs List */}
            <Paper>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : logs.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No audit logs found matching your criteria</Typography>
                    </Box>
                ) : (
                    <List>
                        {logs.map((log, index) => (
                            <React.Fragment key={log._id}>
                                <ListItem 
                                    alignItems="flex-start" 
                                    sx={{ 
                                        py: 2, 
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', cursor: 'pointer' } 
                                    }}
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setDetailsDialog(true);
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ 
                                            bgcolor: log.severity === 'CRITICAL' ? '#ffebee' : 
                                                     log.severity === 'HIGH' ? '#fff3e0' :
                                                     log.severity === 'MEDIUM' ? '#e3f2fd' : '#e8f5e8'
                                        }}>
                                            {getIcon(log.severity)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {log.userEmail}
                                                </Typography>
                                                <Chip 
                                                    label={log.action} 
                                                    size="small" 
                                                    variant="outlined"
                                                    color="primary"
                                                />
                                                <Chip
                                                    label={log.severity}
                                                    size="small"
                                                    color={getSeverityColor(log.severity)}
                                                    variant="filled"
                                                />
                                                {log.targetName && (
                                                    <Chip
                                                        label={`Target: ${log.targetName}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="default"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    {log.userRole} • Company {log.companyId} • IP: {log.ipAddress}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTimestamp(log.timestamp)} • ID: {log._id.slice(-8)}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <Tooltip title="View Details">
                                        <IconButton size="small">
                                            <SearchIcon />
                                        </IconButton>
                                    </Tooltip>
                                </ListItem>
                                {index < logs.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, newPage) => setPage(newPage)}
                            color="primary"
                        />
                    </Box>
                )}
            </Paper>

            {/* Log Details Dialog */}
            <Dialog 
                open={detailsDialog} 
                onClose={() => setDetailsDialog(false)} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>
                    Audit Log Details
                </DialogTitle>
                <DialogContent>
                    {selectedLog && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">User</Typography>
                                    <Typography variant="body1">{selectedLog.userEmail}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                                    <Typography variant="body1">{selectedLog.userRole}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                                    <Typography variant="body1">{selectedLog.action}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
                                    <Chip 
                                        label={selectedLog.severity} 
                                        size="small" 
                                        color={getSeverityColor(selectedLog.severity)}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Target Type</Typography>
                                    <Typography variant="body1">{selectedLog.targetType}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Target Name</Typography>
                                    <Typography variant="body1">{selectedLog.targetName || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
                                    <Typography variant="body1">{selectedLog.ipAddress}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Company ID</Typography>
                                    <Typography variant="body1">{selectedLog.companyId}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                                    <Typography variant="body1">{formatTimestamp(selectedLog.timestamp)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        {selectedLog.userAgent || 'N/A'}
                                    </Typography>
                                </Grid>
                                {selectedLog.details && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">Details</Typography>
                                        <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                                            <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                                                {JSON.stringify(selectedLog.details, null, 2)}
                                            </pre>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AuditLogs;
