import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, TextField, FormControl,
    InputLabel, Select, MenuItem, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemIcon, ListItemText, Chip, CircularProgress, Divider
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Assignment as AssignmentIcon,
    History as HistoryIcon,
    Storage as StorageIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const BulkDataCleanup = () => {
    const [cleanupType, setCleanupType] = useState('');
    const [olderThanDays, setOlderThanDays] = useState(30);
    const [companyId, setCompanyId] = useState('');
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastCleanup, setLastCleanup] = useState(null);

    const cleanupOptions = [
        {
            type: 'tickets',
            label: 'Closed/Resolved Tickets',
            description: 'Remove old tickets that are closed or resolved',
            icon: <AssignmentIcon />,
            color: 'primary',
            warning: 'This will permanently delete ticket data including comments and attachments'
        },
        {
            type: 'audit_logs',
            label: 'Audit Logs',
            description: 'Remove old audit log entries',
            icon: <HistoryIcon />,
            color: 'secondary',
            warning: 'This will permanently delete audit trail data'
        },
        {
            type: 'system_health',
            label: 'System Health Snapshots',
            description: 'Remove old system health monitoring data',
            icon: <StorageIcon />,
            color: 'success',
            warning: 'This will permanently delete historical system health data'
        }
    ];

    const handleCleanup = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/system-admin/cleanup', {
                type: cleanupType,
                olderThanDays,
                companyId: companyId || undefined
            });

            setLastCleanup({
                type: cleanupType,
                deletedCount: response.data.deletedCount,
                timestamp: new Date(),
                success: true
            });

            setConfirmDialog(false);
            setCleanupType('');
            setOlderThanDays(30);
            setCompanyId('');
        } catch (error) {
            console.error('Cleanup failed:', error);
            setLastCleanup({
                type: cleanupType,
                error: error.response?.data?.message || 'Cleanup failed',
                timestamp: new Date(),
                success: false
            });
        } finally {
            setLoading(false);
        }
    };

    const getCleanupOption = (type) => {
        return cleanupOptions.find(option => option.type === type);
    };

    const formatDate = (date) => {
        return date.toLocaleString();
    };

    const calculateCutoffDate = () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        return cutoff.toLocaleDateString();
    };

    return (
        <Box maxWidth="1200px" margin="0 auto">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929', mb: 1 }}>
                    🗑️ Bulk Data Cleanup
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Safely remove old data to optimize system performance and storage
                </Typography>
            </Box>

            {/* Warning Alert */}
            <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    ⚠️ CRITICAL WARNING
                </Typography>
                <Typography variant="body2">
                    Bulk data cleanup operations are IRREVERSIBLE. All deleted data will be permanently lost.
                    Ensure you have proper backups before proceeding. All cleanup actions are logged for audit purposes.
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                {/* Cleanup Configuration */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Cleanup Configuration
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Data Type to Clean</InputLabel>
                                    <Select
                                        value={cleanupType}
                                        label="Data Type to Clean"
                                        onChange={(e) => setCleanupType(e.target.value)}
                                    >
                                        <MenuItem value="">Select data type...</MenuItem>
                                        {cleanupOptions.map((option) => (
                                            <MenuItem key={option.type} value={option.type}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {option.icon}
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {option.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {option.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Delete data older than (days)"
                                    type="number"
                                    value={olderThanDays}
                                    onChange={(e) => setOlderThanDays(parseInt(e.target.value) || 0)}
                                    inputProps={{ min: 1, max: 365 }}
                                    helperText={`Data created before ${calculateCutoffDate()} will be deleted`}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Company ID (optional)"
                                    type="number"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(e.target.value)}
                                    helperText="Leave empty to clean data from all companies"
                                />
                            </Grid>

                            {cleanupType && (
                                <Grid item xs={12}>
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {getCleanupOption(cleanupType)?.label} Cleanup
                                        </Typography>
                                        <Typography variant="body2">
                                            {getCleanupOption(cleanupType)?.warning}
                                        </Typography>
                                    </Alert>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="large"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setConfirmDialog(true)}
                                    disabled={!cleanupType || olderThanDays < 1}
                                    fullWidth
                                >
                                    Execute Bulk Cleanup
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Cleanup Options Info */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Available Cleanup Types
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <List>
                            {cleanupOptions.map((option) => (
                                <ListItem key={option.type} sx={{ px: 0 }}>
                                    <ListItemIcon>
                                        {option.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={option.label}
                                        secondary={option.description}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                💡 <strong>Best Practice:</strong> Start with longer retention periods (90+ days) 
                                and gradually reduce as needed. Always verify backups before cleanup.
                            </Typography>
                        </Alert>
                    </Paper>
                </Grid>

                {/* Last Cleanup Results */}
                {lastCleanup && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Last Cleanup Results
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                {lastCleanup.success ? (
                                    <CheckCircleIcon color="success" />
                                ) : (
                                    <ErrorIcon color="error" />
                                )}
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {getCleanupOption(lastCleanup.type)?.label} Cleanup
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(lastCleanup.timestamp)}
                                    </Typography>
                                </Box>
                                <Box sx={{ ml: 'auto' }}>
                                    {lastCleanup.success ? (
                                        <Chip 
                                            label={`${lastCleanup.deletedCount} records deleted`} 
                                            color="success" 
                                            variant="outlined"
                                        />
                                    ) : (
                                        <Chip 
                                            label="Failed" 
                                            color="error" 
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>

                            {!lastCleanup.success && (
                                <Alert severity="error">
                                    <Typography variant="body2">
                                        <strong>Error:</strong> {lastCleanup.error}
                                    </Typography>
                                </Alert>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <WarningIcon color="error" />
                        Confirm Bulk Data Cleanup
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            THIS ACTION CANNOT BE UNDONE
                        </Typography>
                        <Typography variant="body2">
                            You are about to permanently delete data. Please confirm the details below:
                        </Typography>
                    </Alert>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Data Type</Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {getCleanupOption(cleanupType)?.label}
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Retention Period</Typography>
                            <Typography variant="body1">
                                Delete data older than {olderThanDays} days
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary">Cutoff Date</Typography>
                            <Typography variant="body1">
                                Before {calculateCutoffDate()}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Scope</Typography>
                            <Typography variant="body1">
                                {companyId ? `Company ID: ${companyId}` : 'All Companies'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Warning</Typography>
                            <Typography variant="body2" color="error">
                                {getCleanupOption(cleanupType)?.warning}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="body2">
                            This action will be logged in the audit trail with your user information and timestamp.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={handleCleanup}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {loading ? 'Executing Cleanup...' : 'Confirm Deletion'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkDataCleanup;