import React, { useState } from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, Button, TextField, List, ListItem, ListItemText, ListItemIcon, Avatar, Snackbar, Alert, Divider } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    People as PeopleIcon,
    Hub as HubIcon,
    Business as BusinessIcon,
    Timer as TimerIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Send as SendIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

// Mock Data for Chart
const data = [
    { time: '00:00', latency: 45 },
    { time: '04:00', latency: 30 },
    { time: '08:00', latency: 120 }, // Morning rush
    { time: '12:00', latency: 85 },
    { time: '16:00', latency: 95 },
    { time: '20:00', latency: 50 },
    { time: '23:59', latency: 40 },
];

const MOCK_LOGS = [
    { id: 1, type: 'info', msg: 'System Backup completed successfully', time: '2 mins ago' },
    { id: 2, type: 'warning', msg: 'High latency detected in Ethio Telecom node', time: '15 mins ago' },
    { id: 3, type: 'success', msg: 'New Company "Siket Bank" registered', time: '1 hour ago' },
    { id: 4, type: 'error', msg: 'Failed login attempt from ip 192.168.1.55', time: '2 hours ago' },
    { id: 5, type: 'info', msg: 'Database index optimization finished', time: '5 hours ago' },
];

const SysDashboard = () => {
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [toastOpen, setToastOpen] = useState(false);

    const handleBroadcast = () => {
        if (!broadcastMsg.trim()) return;
        setToastOpen(true);
        setBroadcastMsg('');
    };

    const MetricCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', borderLeft: `5px solid ${color}` }}>
            <CardContent display="flex" sx={{ alignItems: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box maxWidth="1600px" margin="0 auto">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    System Overview
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    component={RouterLink}
                    to="/sys-admin/reports"
                    sx={{ 
                        bgcolor: '#1e4fb1',
                        '&:hover': { bgcolor: '#1a3d8f' },
                        fontWeight: 700
                    }}
                >
                    📊 Reports & Analytics
                </Button>
            </Box>

            {/* Maintenance Mode Alert */}
            <Alert severity="warning" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography>
                        <strong>System Status:</strong> Operational (Maintenance Mode Inactive)
                    </Typography>
                    <Button color="inherit" size="small" href="/sys-admin/settings">
                        Configure
                    </Button>
                </Box>
            </Alert>

            {/* Metrics Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Total Users" value="1,240" icon={<PeopleIcon />} color="#1e4fb1" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Active Sockets" value="84" icon={<HubIcon />} color="#0061f2" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="Companies" value="24" icon={<BusinessIcon />} color="#3f51b5" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard title="System Uptime" value="99.9%" icon={<TimerIcon />} color="#00bcd4" />
                </Grid>
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={3}>
                {/* Left Column: Latency Chart & Broadcast */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Request Latency (ms)
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e4fb1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#1e4fb1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="latency"
                                    stroke="#1e4fb1"
                                    fillOpacity={1}
                                    fill="url(#colorLatency)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>

                    <Paper sx={{ p: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,79,177,0.15)' : '#e3f2fd', borderRadius: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <InfoIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold" color="primary">
                                System-Wide Broadcast
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            Sending a message here will trigger a toast notification for ALL active users across the platform.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="e.g., Scheduled Maintenance in 10 minutes..."
                                size="small"
                                value={broadcastMsg}
                                onChange={(e) => setBroadcastMsg(e.target.value)}
                                sx={{ bgcolor: 'white', borderRadius: 1 }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<SendIcon />}
                                onClick={handleBroadcast}
                            >
                                SEND
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column: Global Logs */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ height: '100%', overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.action.hover, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight="bold">
                                Recent Global Logs
                            </Typography>
                        </Box>
                        <List sx={{ p: 0 }}>
                            {MOCK_LOGS.map((log, index) => (
                                <Box key={log.id}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                            {log.type === 'info' && <InfoIcon color="info" fontSize="small" />}
                                            {log.type === 'warning' && <WarningIcon color="warning" fontSize="small" />}
                                            {log.type === 'error' && <WarningIcon color="error" fontSize="small" />}
                                            {log.type === 'success' && <CheckCircleIcon color="success" fontSize="small" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2" sx={{ fontSize: '0.9rem' }}>
                                                    {log.msg}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.time}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    {index < MOCK_LOGS.length - 1 && <Divider component="li" />}
                                </Box>
                            ))}
                        </List>
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Button size="small">View All Logs</Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={toastOpen}
                autoHideDuration={4000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="info" variant="filled" onClose={() => setToastOpen(false)}>
                    📢 Broadcast Sent: "{broadcastMsg}"
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SysDashboard;
