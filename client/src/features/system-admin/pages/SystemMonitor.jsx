import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, Alert, Button,
    List, ListItem, ListItemText, ListItemIcon, Divider, Chip,
    LinearProgress, IconButton, Tooltip, Switch, FormControlLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import {
    Memory as MemoryIcon,
    Storage as StorageIcon,
    NetworkCheck as NetworkIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Notifications as NotificationIcon,
    Timeline as TimelineIcon,
    Computer as ServerIcon,
    Storage as DatabaseIcon
} from '@mui/icons-material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts';

const SystemMonitor = () => {
    const [systemMetrics, setSystemMetrics] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [services, setServices] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [alertDialog, setAlertDialog] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock system data
    const mockMetrics = {
        cpu: { usage: 67, cores: 8, temperature: 58 },
        memory: { used: 12.4, total: 16, percentage: 77.5 },
        storage: { used: 245, total: 500, percentage: 49 },
        network: { inbound: 125.6, outbound: 89.3, latency: 23 },
        database: { connections: 45, queries: 1247, size: 2.4 },
        uptime: '15 days, 7 hours'
    };

    const mockServices = [
        { name: 'Web Server', status: 'running', port: 3000, uptime: '99.9%', lastCheck: '30s ago' },
        { name: 'Database', status: 'running', port: 27017, uptime: '99.8%', lastCheck: '15s ago' },
        { name: 'Redis Cache', status: 'running', port: 6379, uptime: '99.9%', lastCheck: '45s ago' },
        { name: 'Email Service', status: 'warning', port: 587, uptime: '98.2%', lastCheck: '2m ago' },
        { name: 'File Storage', status: 'running', port: 9000, uptime: '99.7%', lastCheck: '1m ago' },
        { name: 'Backup Service', status: 'stopped', port: null, uptime: '0%', lastCheck: '5m ago' }
    ];

    const mockAlerts = [
        {
            id: 1,
            type: 'warning',
            title: 'High Memory Usage',
            message: 'Memory usage has exceeded 75% for the last 10 minutes',
            timestamp: new Date(Date.now() - 600000),
            severity: 'medium',
            resolved: false
        },
        {
            id: 2,
            type: 'error',
            title: 'Backup Service Down',
            message: 'Automated backup service has stopped responding',
            timestamp: new Date(Date.now() - 300000),
            severity: 'high',
            resolved: false
        },
        {
            id: 3,
            type: 'info',
            title: 'Database Optimization Complete',
            message: 'Scheduled database optimization completed successfully',
            timestamp: new Date(Date.now() - 1800000),
            severity: 'low',
            resolved: true
        }
    ];

    const mockPerformanceData = [
        { time: '00:00', cpu: 45, memory: 68, network: 120 },
        { time: '04:00', cpu: 32, memory: 65, network: 89 },
        { time: '08:00', cpu: 78, memory: 82, network: 245 },
        { time: '12:00', cpu: 65, memory: 77, network: 189 },
        { time: '16:00', cpu: 72, memory: 79, network: 167 },
        { time: '20:00', cpu: 58, memory: 74, network: 134 },
        { time: '23:59', cpu: 67, memory: 77, network: 156 }
    ];

    useEffect(() => {
        // Initial data load
        setTimeout(() => {
            setSystemMetrics(mockMetrics);
            setServices(mockServices);
            setAlerts(mockAlerts);
            setPerformanceData(mockPerformanceData);
            setLoading(false);
        }, 1000);

        // Auto-refresh interval
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                // Simulate real-time updates
                setSystemMetrics(prev => ({
                    ...prev,
                    cpu: { ...prev.cpu, usage: Math.max(30, Math.min(90, prev.cpu.usage + (Math.random() * 10 - 5))) },
                    memory: { ...prev.memory, percentage: Math.max(60, Math.min(85, prev.memory.percentage + (Math.random() * 4 - 2))) },
                    network: { 
                        ...prev.network, 
                        inbound: Math.max(50, Math.min(200, prev.network.inbound + (Math.random() * 20 - 10))),
                        outbound: Math.max(30, Math.min(150, prev.network.outbound + (Math.random() * 15 - 7.5)))
                    }
                }));
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const MetricCard = ({ title, value, unit, percentage, icon, color, status }) => (
        <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {value} {unit}
                        </Typography>
                        {percentage !== undefined && (
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
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
                        )}
                        {status && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {status}
                            </Typography>
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

    const getServiceStatusIcon = (status) => {
        switch (status) {
            case 'running': return <CheckCircleIcon color="success" />;
            case 'warning': return <WarningIcon color="warning" />;
            case 'stopped': return <ErrorIcon color="error" />;
            default: return <ErrorIcon color="disabled" />;
        }
    };

    const getServiceStatusColor = (status) => {
        switch (status) {
            case 'running': return 'success';
            case 'warning': return 'warning';
            case 'stopped': return 'error';
            default: return 'default';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return <ErrorIcon color="error" />;
            case 'warning': return <WarningIcon color="warning" />;
            default: return <CheckCircleIcon color="info" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            default: return 'info';
        }
    };

    const handleAlertClick = (alert) => {
        setSelectedAlert(alert);
        setAlertDialog(true);
    };

    const resolveAlert = () => {
        // Simulate resolving alert
        setAlerts(prev => prev.map(alert => 
            alert.id === selectedAlert.id ? { ...alert, resolved: true } : alert
        ));
        setAlertDialog(false);
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                        System Monitor
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Real-time system performance and health monitoring
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                            />
                        }
                        label="Auto Refresh"
                    />
                    <Tooltip title="Refresh Now">
                        <IconButton onClick={() => window.location.reload()}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="outlined" startIcon={<SettingsIcon />}>
                        Configure
                    </Button>
                </Box>
            </Box>

            {/* System Health Alert */}
            <Alert 
                severity={alerts.filter(a => !a.resolved && a.severity === 'high').length > 0 ? 'error' : 
                         alerts.filter(a => !a.resolved && a.severity === 'medium').length > 0 ? 'warning' : 'success'} 
                sx={{ mb: 3 }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    System Status: {alerts.filter(a => !a.resolved && a.severity === 'high').length > 0 ? 'Critical Issues Detected' :
                                   alerts.filter(a => !a.resolved && a.severity === 'medium').length > 0 ? 'Minor Issues' : 'All Systems Operational'}
                </Typography>
                Uptime: {systemMetrics.uptime} | Last updated: {new Date().toLocaleTimeString()}
            </Alert>

            {/* System Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="CPU Usage"
                        value={systemMetrics.cpu?.usage}
                        unit="%"
                        percentage={systemMetrics.cpu?.usage}
                        icon={<ServerIcon sx={{ color: '#1e4fb1' }} />}
                        color={systemMetrics.cpu?.usage > 80 ? '#f44336' : systemMetrics.cpu?.usage > 60 ? '#ff9800' : '#1e4fb1'}
                        status={`${systemMetrics.cpu?.cores} cores, ${systemMetrics.cpu?.temperature}°C`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Memory Usage"
                        value={systemMetrics.memory?.used}
                        unit="GB"
                        percentage={systemMetrics.memory?.percentage}
                        icon={<MemoryIcon sx={{ color: '#0061f2' }} />}
                        color={systemMetrics.memory?.percentage > 85 ? '#f44336' : systemMetrics.memory?.percentage > 70 ? '#ff9800' : '#0061f2'}
                        status={`${systemMetrics.memory?.used}GB / ${systemMetrics.memory?.total}GB`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Storage Usage"
                        value={systemMetrics.storage?.used}
                        unit="GB"
                        percentage={systemMetrics.storage?.percentage}
                        icon={<StorageIcon sx={{ color: '#3f51b5' }} />}
                        color={systemMetrics.storage?.percentage > 80 ? '#f44336' : systemMetrics.storage?.percentage > 60 ? '#ff9800' : '#3f51b5'}
                        status={`${systemMetrics.storage?.used}GB / ${systemMetrics.storage?.total}GB`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Network I/O"
                        value={systemMetrics.network?.inbound?.toFixed(1)}
                        unit="MB/s"
                        icon={<NetworkIcon sx={{ color: '#00bcd4' }} />}
                        color="#00bcd4"
                        status={`↓${systemMetrics.network?.inbound?.toFixed(1)} ↑${systemMetrics.network?.outbound?.toFixed(1)} MB/s`}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Performance Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            System Performance (24 Hours)
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <ChartTooltip />
                                <Line type="monotone" dataKey="cpu" stroke="#1e4fb1" strokeWidth={2} name="CPU %" />
                                <Line type="monotone" dataKey="memory" stroke="#0061f2" strokeWidth={2} name="Memory %" />
                                <Line type="monotone" dataKey="network" stroke="#00bcd4" strokeWidth={2} name="Network MB/s" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Services Status */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Service Status
                        </Typography>
                        <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                            {services.map((service, index) => (
                                <Box key={service.name}>
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {getServiceStatusIcon(service.status)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {service.name}
                                                    </Typography>
                                                    <Chip 
                                                        label={service.status} 
                                                        size="small" 
                                                        color={getServiceStatusColor(service.status)}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    {service.port && (
                                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                                            Port: {service.port}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary">
                                                        Uptime: {service.uptime} | {service.lastCheck}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {index < services.length - 1 && <Divider component="li" />}
                                </Box>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* System Alerts */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                System Alerts
                            </Typography>
                            <Chip 
                                label={`${alerts.filter(a => !a.resolved).length} active`}
                                color={alerts.filter(a => !a.resolved).length > 0 ? 'error' : 'success'}
                                size="small"
                            />
                        </Box>
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {alerts.map((alert, index) => (
                                <Box key={alert.id}>
                                    <ListItem 
                                        alignItems="flex-start" 
                                        sx={{ 
                                            px: 0, 
                                            cursor: 'pointer',
                                            opacity: alert.resolved ? 0.6 : 1,
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                        onClick={() => handleAlertClick(alert)}
                                    >
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
                                                    {alert.resolved && (
                                                        <Chip label="Resolved" size="small" color="success" />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        {alert.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {alert.timestamp.toLocaleString()}
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

                {/* Database Metrics */}
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            Database Performance
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <DatabaseIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                        {systemMetrics.database?.connections}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Connections
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <TimelineIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                                        {systemMetrics.database?.queries}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Queries/Hour
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Database Health: Optimal
                                    </Typography>
                                    Size: {systemMetrics.database?.size}GB | Query performance: Good
                                </Alert>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Alert Details Dialog */}
            <Dialog open={alertDialog} onClose={() => setAlertDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationIcon color="warning" />
                    Alert Details
                </DialogTitle>
                <DialogContent>
                    {selectedAlert && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {selectedAlert.title}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {selectedAlert.message}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
                                    <Chip 
                                        label={selectedAlert.severity} 
                                        color={getSeverityColor(selectedAlert.severity)} 
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip 
                                        label={selectedAlert.resolved ? 'Resolved' : 'Active'} 
                                        color={selectedAlert.resolved ? 'success' : 'error'} 
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                                    <Typography variant="body2">
                                        {selectedAlert.timestamp.toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAlertDialog(false)}>Close</Button>
                    {selectedAlert && !selectedAlert.resolved && (
                        <Button variant="contained" onClick={resolveAlert}>
                            Mark as Resolved
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SystemMonitor;
