import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Select, FormControl, InputLabel, Grid, Alert, Snackbar, Chip, Card, CardContent, Avatar, LinearProgress } from '@mui/material';
import { Send as SendIcon, Campaign as CampaignIcon, Group as GroupIcon, NotificationsActive as BellIcon, TrendingUp as TrendingIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { COMPANIES, getCompanyById, formatCompanyLabel } from '../../../utils/companies';
import { ROLE_LABELS, ROLES } from '../../../constants/roles';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';

const BroadcastCenter = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const isSystemAdmin = user?.role === ROLES.SYSTEM_ADMIN;

    const [targetAudience, setTargetAudience] = useState('all');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('info');
    const [toastOpen, setToastOpen] = useState(false);
    const [lastSent, setLastSent] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [historyError, setHistoryError] = useState('');

    const roleTargets = useMemo(() => {
        return Object.entries(ROLE_LABELS).filter(([role]) => !['Worker', 'System Admin'].includes(role));
    }, []);

    useEffect(() => {
        if (isSuperAdmin && targetAudience === 'all') {
            setTargetAudience('company:self');
        }
    }, [isSuperAdmin, targetAudience]);

    const describeAudience = (audience) => {
        if (audience === 'all') return 'all active users';
        if (audience === 'company:self') return formatCompanyLabel(getCompanyById(user?.companyId));
        if (audience.startsWith('company:')) {
            const company = getCompanyById(audience.replace('company:', ''));
            return company ? formatCompanyLabel(company) : audience;
        }
        if (audience.startsWith('role:')) {
            const role = audience.replace('role:', '');
            return ROLE_LABELS[role] || role;
        }
        return audience;
    };

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await axios.get('/api/notifications/broadcasts?limit=50');
                setHistory(res.data || []);
            } catch (error) {
                setHistoryError('Failed to load broadcast history');
            } finally {
                setLoadingHistory(false);
            }
        };
        loadHistory();
    }, []);

    const handleSend = async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) return;

        try {
            // Parse target audience
            let targetType = 'all';
            let targetValue = '';
            let targetCompanyId = null;

            if (targetAudience === 'company:self') {
                targetType = 'company';
                targetValue = String(user?.companyId || '');
            } else if (targetAudience.startsWith('company:')) {
                targetType = 'company';
                targetValue = targetAudience.replace('company:', '');
            } else if (targetAudience.startsWith('role:')) {
                targetType = 'role';
                targetValue = targetAudience.replace('role:', '');
                if (isSuperAdmin) {
                    targetCompanyId = Number(user?.companyId);
                }
            }

            const payload = {
                message: trimmedMessage,
                priority,
                targetType,
                targetValue,
                targetCompanyId
            };

            const res = await axios.post('/api/notifications/broadcast', payload);

            setLastSent({
                message: trimmedMessage,
                target: describeAudience(targetAudience)
            });
            setToastOpen(true);
            setHistory((prev) => [res.data, ...prev]);
            setMessage('');
        } catch (error) {
            console.error(error);
            alert('Failed to broadcast message');
        }
    };

    const getTargetLabel = (item) => {
        if (item.targetType === 'all') return 'All Users';
        if (item.targetType === 'company') {
            const company = getCompanyById(Number(item.targetValue));
            return company ? formatCompanyLabel(company) : `Company ${item.targetValue}`;
        }
        if (item.targetType === 'role') {
            return ROLE_LABELS[item.targetValue] || item.targetValue;
        }
        return item.targetValue || 'Unknown';
    };

    const formatTime = (dateValue) => {
        if (!dateValue) return '';
        return new Date(dateValue).toLocaleString();
    };

    return (
        <Box maxWidth="1400px" margin="0 auto" sx={{ px: { xs: 2, sm: 3 } }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 2, fontSize: { xs: '2rem', sm: '3rem' } }}>
                    Command Center
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    {isSystemAdmin
                        ? 'Real-time broadcast system across all organizations'
                        : 'Real-time broadcast system for your organization'}
                </Typography>

                {/* Stats Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #1e4fb115 0%, #1e4fb105 100%)', borderLeft: '4px solid #1e4fb1' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#1e4fb1', mr: 2 }}>
                                    <GroupIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#1e4fb1">
                                        System-Wide
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Targeting 24 Organizations
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={100} sx={{ bgcolor: 'rgba(30, 79, 177, 0.1)' }} />
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #4caf5015 0%, #4caf5005 100%)', borderLeft: '4px solid #4caf50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                                    <BellIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#4caf50">
                                        {history.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Messages Sent
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={100} sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }} />
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #ff980015 0%, #ff980005 100%)', borderLeft: '4px solid #ff9800' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                                    <ScheduleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#ff9800">
                                        Online
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Real-time Socket Gateway
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={100} sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }} />
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #0061f215 0%, #0061f205 100%)', borderLeft: '4px solid #0061f2' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#0061f2', mr: 2 }}>
                                    <TrendingIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#0061f2">
                                        Instant
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Message Delivery Mode
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={100} sx={{ bgcolor: 'rgba(0, 97, 242, 0.1)' }} />
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            <Grid container spacing={4}>
                {/* Compose Form */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <CampaignIcon color="primary" sx={{ fontSize: 40 }} />
                            <Box>
                                <Typography variant="h6">Compose Message</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Send alerts to active users in real-time.
                                </Typography>
                            </Box>
                        </Box>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Target Audience</InputLabel>
                            <Select
                                value={targetAudience}
                                label="Target Audience"
                                onChange={(e) => setTargetAudience(e.target.value)}
                            >
                                {!isSuperAdmin && (
                                    <MenuItem value="all">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <GroupIcon fontSize="small" /> All Active Users (Global)
                                        </Box>
                                    </MenuItem>
                                )}
                                {isSuperAdmin ? (
                                    <MenuItem value="company:self">
                                        {formatCompanyLabel(getCompanyById(user?.companyId))}
                                    </MenuItem>
                                ) : (
                                    <>
                                        <MenuItem disabled>--- Specific Company ---</MenuItem>
                                        {COMPANIES.map(c => (
                                            <MenuItem key={c.id} value={`company:${c.id}`}>{formatCompanyLabel(c)}</MenuItem>
                                        ))}
                                    </>
                                )}
                                <MenuItem disabled>--- Specific Role ---</MenuItem>
                                {roleTargets.map(([key, val]) => (
                                    <MenuItem key={key} value={`role:${key}`}>{val}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Priority Level</InputLabel>
                            <Select
                                value={priority}
                                label="Priority Level"
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <MenuItem value="info">Info (Blue)</MenuItem>
                                <MenuItem value="warning">Warning (Orange)</MenuItem>
                                <MenuItem value="error">Critical (Red)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Message Content"
                            placeholder="Type your announcement here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<SendIcon />}
                            onClick={handleSend}
                            disabled={!message.trim()}
                            color={priority === 'error' ? 'error' : priority === 'warning' ? 'warning' : 'primary'}
                        >
                            Broadcast Message
                        </Button>
                    </Paper>
                </Grid>

                {/* History */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Recent Broadcasts</Typography>
                        {loadingHistory && <LinearProgress sx={{ mb: 2 }} />}
                        {historyError && <Alert severity="error" sx={{ mb: 2 }}>{historyError}</Alert>}
                        {!loadingHistory && history.length === 0 && (
                            <Alert severity="info">No broadcasts yet.</Alert>
                        )}
                        {history.map((item) => (
                            <Box key={item._id || item.id} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>{item.message || item.msg}</Typography>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1, mt: 1 }}>
                                    <Chip label={getTargetLabel(item)} size="small" variant="outlined" />
                                    <Typography variant="caption" color="text.secondary">{formatTime(item.createdAt) || item.time}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>

            {/* Toast */}
            <Snackbar
                open={toastOpen}
                autoHideDuration={4000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={priority} variant="filled" onClose={() => setToastOpen(false)}>
                    {lastSent ? `Sent: "${lastSent.message}" to ${lastSent.target}` : 'Broadcast sent'}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BroadcastCenter;
