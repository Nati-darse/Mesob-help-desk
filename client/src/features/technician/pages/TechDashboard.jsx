import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, Typography, Box, Button, Card, CardContent, FormControl, Select, MenuItem, 
    CircularProgress, Grid, Chip
} from '@mui/material';
import {
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';

const TechDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dutyStatus, setDutyStatus] = useState('Online');
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            setDutyStatus(user.dutyStatus || 'Online');
            fetchPerformanceMetrics();
        }
    }, [user]);

    const fetchPerformanceMetrics = async () => {
        try {
            const res = await axios.get('/api/technician/performance');
            setPerformance(res.data);
        } catch (error) {
            console.error('Error fetching performance:', error);
            // Set mock data if API fails
            setPerformance({
                avgResponseTime: '0',
                avgResolutionTime: '0',
                todayResolved: 0,
                totalResolved: 0,
                totalAssigned: 4,
                responseTimeCount: 0,
                resolutionTimeCount: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDutyStatusChange = async (newStatus) => {
        setStatusUpdating(true);
        try {
            await axios.put('/api/technician/duty-status', { dutyStatus: newStatus });
            setDutyStatus(newStatus);
            
            if (user) {
                const updatedUser = { ...user, dutyStatus: newStatus };
                localStorage.setItem('mesob_user', JSON.stringify(updatedUser));
            }
            
            // Show success feedback (optional)
            console.log(`Duty status updated to: ${newStatus}`);
        } catch (error) {
            console.error('Error updating duty status:', error);
            if (error.response?.status !== 401) {
                alert(`Failed to update duty status: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleOpenMissionControl = () => {
        // Navigate to a mission control view or show advanced ticket management
        navigate('/tech/mission-control');
    };

    const handleViewAllTickets = () => {
        // Navigate to tickets page or show all tickets dialog
        navigate('/tickets');
    };

    const handleRefreshDashboard = () => {
        setLoading(true);
        fetchPerformanceMetrics();
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
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0A1929' }}>
                    MESOB Technician Workspace
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome, {user?.name || 'Alex Rodriguez'}. MESOB IT Support Team for all client companies.
                </Typography>
            </Box>

            {/* Current Duty Status Card - Matching the image */}
            <Card sx={{ 
                mb: 4, 
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', 
                color: 'white',
                borderRadius: 3
            }}>
                <CardContent sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Current Duty Status
                            </Typography>
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
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                Change Status:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
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
                                    <MenuItem value="Online">Online (Available)</MenuItem>
                                    <MenuItem value="On-Site">On-Site (Busy)</MenuItem>
                                    <MenuItem value="Break">Break (Unavailable)</MenuItem>
                                    <MenuItem value="Offline">Offline</MenuItem>
                                </Select>
                                {statusUpdating && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                            Updating status...
                                        </Typography>
                                    </Box>
                                )}
                            </FormControl>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* My Efficiency Dashboard - Matching the image layout */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    My Efficiency Dashboard
                </Typography>
                
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                                {performance?.avgResponseTime || '0'}h
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                Avg. Response Time
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ({performance?.responseTimeCount || 0} tickets)
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#2e7d32', mb: 1 }}>
                                {performance?.avgResolutionTime || '0'}h
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                Avg. Resolution Time
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ({performance?.resolutionTimeCount || 0} tickets)
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#ed6c02', mb: 1 }}>
                                {performance?.todayResolved || 0}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                Resolved Today
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: '#0288d1', mb: 1 }}>
                                {performance?.totalResolved || 0}/{performance?.totalAssigned || 4}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" fontWeight="500">
                                Total Resolved
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Action Buttons - Matching the image */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleOpenMissionControl}
                    sx={{ 
                        px: 4, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none'
                    }}
                >
                    Open Mission Control
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={handleViewAllTickets}
                    sx={{ 
                        px: 4, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none'
                    }}
                >
                    View All Tickets
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    onClick={handleRefreshDashboard}
                    startIcon={<RefreshIcon />}
                    sx={{ 
                        px: 4, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none'
                    }}
                >
                    Refresh Dashboard
                </Button>
            </Box>
        </Container>
    );
};

export default TechDashboard;