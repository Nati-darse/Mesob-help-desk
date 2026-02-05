import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, Card, CardContent, Grid,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Alert, CircularProgress, LinearProgress, Chip, List, ListItem,
    ListItemText, ListItemIcon, FormControlLabel, Checkbox,
    Divider, IconButton, Tooltip
} from '@mui/material';
import {
    DeleteSweep as CleanupIcon,
    Storage as StorageIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon,
    Download as ExportIcon
} from '@mui/icons-material';
import axios from 'axios';

const BulkDataCleanup = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [cleanupDialog, setCleanupDialog] = useState(false);
    const [selectedCleanup, setSelectedCleanup] = useState(null);
    const [cleanupProgress, setCleanupProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [exportDialog, setExportDialog] = useState(false);

    const cleanupOptions = [
        {
            id: 'old-tickets',
            title: 'Old Resolved Tickets',
            description: 'Remove tickets resolved more than 2 years ago',
            risk: 'low',
            estimatedCount: stats.oldTickets || 0,
            confirmPhrase: 'DELETE OLD TICKETS'
        },
        {
            id: 'inactive-users',
            title: 'Inactive User Accounts',
            description: 'Remove users who haven\'t logged in for 1+ years',
            risk: 'medium',
            estimatedCount: stats.inactiveUsers || 0,
            confirmPhrase: 'DELETE INACTIVE USERS'
        },
        {
            id: 'orphaned-files',
            title: 'Orphaned File Attachments',
            description: 'Remove file attachments with no associated tickets',
            risk: 'low',
            estimatedCount: stats.orphanedFiles || 0,
            confirmPhrase: 'DELETE ORPHANED FILES'
        },
        {
            id: 'audit-logs',
            title: 'Old Audit Logs',
            description: 'Archive audit logs older than 3 years',
            risk: 'medium',
            estimatedCount: stats.oldLogs || 0,
            confirmPhrase: 'ARCHIVE OLD LOGS'
        },
        {
            id: 'temp-data',
            title: 'Temporary Data',
            description: 'Clear temporary files and cache data',
            risk: 'low',
            estimatedCount: stats.tempData || 0,
            confirmPhrase: 'CLEAR TEMP DATA'
        },
        {
            id: 'duplicate-records',
            title: 'Duplicate Records',
            description: 'Remove duplicate user and company records',
            risk: 'high',
            estimatedCount: stats.duplicates || 0,
            confirmPhrase: 'REMOVE DUPLICATES'
        }
    ];

    useEffect(() => {
        fetchCleanupStats();
    }, []);

    const fetchCleanupStats = async () => {
        try {
            const res = await axios.get('/api/system-admin/cleanup-stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching cleanup stats:', error);
            // Mock data for demo
            setStats({
                oldTickets: 1247,
                inactiveUsers: 89,
                orphanedFiles: 156,
                oldLogs: 5432,
                tempData: 234,
                duplicates: 12
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCleanupStart = (option) => {
        setSelectedCleanup(option);
        setCleanupDialog(true);
        setConfirmText('');
    };

    const executeCleanup = async () => {
        if (confirmText !== selectedCleanup.confirmPhrase) {
            alert('Confirmation phrase does not match');
            return;
        }

        setIsProcessing(true);
        setCleanupProgress(0);

        try {
            // Simulate progress
            const interval = setInterval(() => {
                setCleanupProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 500);

            await axios.post('/api/system-admin/bulk-cleanup', {
                type: selectedCleanup.id
            });

            setTimeout(() => {
                setIsProcessing(false);
                setCleanupDialog(false);
                fetchCleanupStats();
                alert(`${selectedCleanup.title} cleanup completed successfully`);
            }, 5000);

        } catch (error) {
            console.error('Cleanup error:', error);
            setIsProcessing(false);
            alert('Cleanup failed');
        }
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'low': return 'success';
            case 'medium': return 'warning';
            case 'high': return 'error';
            default: return 'default';
        }
    };

    const handleExportData = async (type) => {
        try {
            const res = await axios.get(`/api/system-admin/export-data/${type}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed');
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                    Bulk Data Cleanup
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                    <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={() => setExportDialog(true)}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Export Data
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchCleanupStats}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Refresh Stats
                    </Button>
                </Box>
            </Box>

            <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>⚠️ Critical System Operation</Typography>
                Bulk cleanup operations are irreversible. Always export data before cleanup and ensure you have recent backups.
            </Alert>

            <Grid container spacing={3}>
                {cleanupOptions.map((option) => (
                    <Grid item xs={12} md={6} key={option.id}>
                        <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                            {option.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {option.description}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={`${option.risk} risk`}
                                        color={getRiskColor(option.risk)}
                                        size="small"
                                        sx={{ ml: 1 }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StorageIcon color="action" fontSize="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            {option.estimatedCount.toLocaleString()} items
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                                        <Tooltip title="Export before cleanup">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleExportData(option.id)}
                                            >
                                                <ExportIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            variant="contained"
                                            color={option.risk === 'high' ? 'error' : 'primary'}
                                            size="small"
                                            startIcon={<CleanupIcon />}
                                            onClick={() => handleCleanupStart(option)}
                                            disabled={option.estimatedCount === 0}
                                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                                        >
                                            Cleanup
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Storage Overview */}
            <Paper sx={{ mt: 4, p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Storage Overview
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                2.4 GB
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Database Size
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                1.8 GB
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                File Attachments
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                                76%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Storage Efficiency
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cleanup Confirmation Dialog */}
            <Dialog open={cleanupDialog} onClose={() => !isProcessing && setCleanupDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Confirm Bulk Cleanup Operation
                </DialogTitle>
                <DialogContent>
                    {!isProcessing ? (
                        <>
                            <Alert severity="error" sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    This operation cannot be undone!
                                </Typography>
                                You are about to permanently delete <strong>{selectedCleanup?.estimatedCount}</strong> items
                                from <strong>{selectedCleanup?.title}</strong>.
                            </Alert>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Operation:</strong> {selectedCleanup?.description}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2 }}>
                                To confirm this operation, type the following phrase exactly:
                            </Typography>

                            <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                                <Typography variant="code" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                    {selectedCleanup?.confirmPhrase}
                                </Typography>
                            </Paper>

                            <TextField
                                fullWidth
                                label="Confirmation Phrase"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type the confirmation phrase above"
                                error={confirmText && confirmText !== selectedCleanup?.confirmPhrase}
                                helperText={confirmText && confirmText !== selectedCleanup?.confirmPhrase ? 
                                    'Confirmation phrase does not match' : ''}
                            />
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress size={60} sx={{ mb: 2 }} />
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Processing Cleanup Operation...
                            </Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={cleanupProgress} 
                                sx={{ width: '100%', height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {cleanupProgress}% Complete
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    {!isProcessing && (
                        <>
                            <Button onClick={() => setCleanupDialog(false)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cancel</Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={executeCleanup}
                                disabled={confirmText !== selectedCleanup?.confirmPhrase}
                                startIcon={<CleanupIcon />}
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                Execute Cleanup
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Export Data Before Cleanup</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Export data categories before performing cleanup operations:
                    </Typography>
                    <List>
                        {cleanupOptions.map((option) => (
                            <ListItem key={option.id} sx={{ px: 0 }}>
                                <ListItemIcon>
                                    <ExportIcon />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={option.title}
                                    secondary={`${option.estimatedCount} items`}
                                />
                                <Button
                                    size="small"
                                    onClick={() => handleExportData(option.id)}
                                >
                                    Export
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button onClick={() => setExportDialog(false)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkDataCleanup;
