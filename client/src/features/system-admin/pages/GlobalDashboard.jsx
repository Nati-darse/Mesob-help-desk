import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, Alert, Button,
    List, ListItem, ListItemText, ListItemIcon, Divider, Chip,
    LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    Assignment as TicketIcon,
    Speed as SpeedIcon,
    Storage as StorageIcon,
    Security as SecurityIcon,
    Refresh as RefreshIcon,
    Notifications as NotificationIcon
} from '@mui/icons-material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const GlobalDashboard = () => {
    const [systemHealth, setSystemHealth] = useState({});
    const [realtimeStats, setRealtimeStats] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/system-admin/global-dashboard');
                setSystemHealth(res.data.systemHealth || {});
                setRealtimeStats(res.data.realtimeStats || {});
                setAlerts(res.data.alerts || []);
                setPerformanceData(res.data.performanceData || []);
            } catch (error) {
                console.error('Failed to load global dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    const MetricCard = ({ title, value, icon, trend, color, subtitle }) => (
        <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                        {trend && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                <TrendingUpIcon fontSize="small" color="success" />
                                <Typography variant="caption" color="success.main">
                                    {trend}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ 
                        bgcolor: `${color}15`, 
                        borderRadius: 2, 
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const HealthIndicator = ({ label, value, color }) => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {value}%
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={value}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                        bgcolor: color,
                        borderRadius: 4
                    }
                }}
            />
        </Box>
    );

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <ErrorIcon color="error" />;
            case 'warning': return <WarningIcon color="warning" />;
            case 'success': return <CheckCircleIcon color="success" />;
            default: return <InfoIcon color="info" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                        Global System Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Real-time monitoring and system overview
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={() => window.location.reload()}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="outlined" startIcon={<NotificationIcon />}>
                        Alerts ({alerts.filter(a => a.severity === 'high').length})
                    </Button>
                </Box>
            </Box>

            {/* System Health Alert */}
            <Alert 
                severity={systemHealth.overall > 95 ? 'success' : systemHealth.overall > 90 ? 'warning' : 'error'} 
                sx={{ mb: 3 }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    System Health: {systemHealth.overall}% - {systemHealth.overall > 95 ? 'Excellent' : systemHealth.overall > 90 ? 'Good' : 'Needs Attention'}
                </Typography>
                All critical systems are operational. Last updated: {new Date().toLocaleTimeString()}
            </Alert>

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Users"
                        value={realtimeStats.activeUsers?.toLocaleString?.() || 0}
                        subtitle={`${realtimeStats.onlineUsers || 0} online now`}
                        icon={<PeopleIcon sx={{ color: '#1e4fb1' }} />}
                        color="#1e4fb1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Organizations"
                        value={realtimeStats.totalCompanies || 0}
                        subtitle="Registered tenants"
                        icon={<BusinessIcon sx={{ color: '#0061f2' }} />}
                        color="#0061f2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Tickets"
                        value={realtimeStats.activeTickets || 0}
                        subtitle={`${realtimeStats.resolvedToday || 0} resolved today`}
                        icon={<TicketIcon sx={{ color: '#3f51b5' }} />}
                        color="#3f51b5"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Avg Response"
                        value={`${realtimeStats.avgResponseTime || 0}h`}
                        subtitle="Resolution time"
                        icon={<SpeedIcon sx={{ color: '#00bcd4' }} />}
                        color="#00bcd4"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Performance Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Real-time System Performance
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <ChartTooltip />
                                <Line type="monotone" dataKey="users" stroke="#1e4fb1" strokeWidth={2} name="Active Users" />
                                <Line type="monotone" dataKey="tickets" stroke="#00bcd4" strokeWidth={2} name="Tickets" />
                                <Line type="monotone" dataKey="response" stroke="#ff9800" strokeWidth={2} name="Response Time (ms)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* System Health */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            System Health Status
                        </Typography>
                        <HealthIndicator 
                            label="Overall System" 
                            value={systemHealth.overall} 
                            color={systemHealth.overall > 95 ? '#4caf50' : systemHealth.overall > 90 ? '#ff9800' : '#f44336'} 
                        />
                        <HealthIndicator label="Database" value={systemHealth.database} color="#4caf50" />
                        <HealthIndicator label="API Services" value={systemHealth.api} color="#ff9800" />
                        <HealthIndicator label="Storage" value={systemHealth.storage} color="#ff9800" />
                        <HealthIndicator label="Network" value={systemHealth.network} color="#4caf50" />
                        
                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                                            {realtimeStats.systemLoad}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            System Load
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700 }}>
                                            {realtimeStats.storageUsed}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Storage Used
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>

                {/* Recent Alerts */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            System Alerts & Notifications
                        </Typography>
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {alerts.map((alert, index) => (
                                <Box key={alert.id}>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                            {getAlertIcon(alert.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {alert.title}
                                                    </Typography>
                                                    <Chip 
                                                        label={alert.severity} 
                                                        size="small" 
                                                        color={getSeverityColor(alert.severity)}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        {alert.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {alert.time}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < alerts.length - 1 && <Divider component="li" />}
                                </Box>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            Quick Actions
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<SecurityIcon />}
                                    sx={{ mb: 2, justifyContent: 'flex-start' }}
                                >
                                    Security Audit
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<StorageIcon />}
                                    sx={{ mb: 2, justifyContent: 'flex-start' }}
                                >
                                    Backup System
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<BusinessIcon />}
                                    sx={{ mb: 2, justifyContent: 'flex-start' }}
                                >
                                    Manage Tenants
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<PeopleIcon />}
                                    sx={{ mb: 2, justifyContent: 'flex-start' }}
                                >
                                    User Analytics
                                </Button>
                            </Grid>
                        </Grid>

                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                System Status: {systemHealth.overall > 90 ? 'Operational' : 'Degraded'}
                            </Typography>
                            Maintenance mode: {realtimeStats.maintenance ? 'Active' : 'Inactive'}
                        </Alert>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GlobalDashboard;
