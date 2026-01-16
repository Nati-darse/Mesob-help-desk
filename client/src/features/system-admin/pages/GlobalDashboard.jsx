import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Paper, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLES } from '../../../constants/roles';

const GlobalDashboard = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [pulseData, setPulseData] = useState([]);
    const [platformHealth, setPlatformHealth] = useState({
        database: { status: '🟢 Online', details: 'MongoDB Cluster' },
        socketio: { status: '🟢 42 Users', details: 'Real-time connections' },
        smtp: { status: '🟢 Active', details: 'Email notifications' },
        api: { status: '🟢 Operational', details: 'Response time: 45ms' }
    });

    // Guard Clause
    if (user?.role !== ROLES.SYSTEM_ADMIN) {
        return <Alert severity="error">Access Denied: System Administrator privileges required.</Alert>;
    }

    // Simulate real-time pulse data
    useEffect(() => {
        const generateInitialData = () => {
            const data = [];
            const now = new Date();
            for (let i = 29; i >= 0; i--) {
                const time = new Date(now - i * 2000);
                data.push({
                    time: time.toLocaleTimeString(),
                    requests: Math.floor(Math.random() * 150) + 50,
                    entities: Math.floor(Math.random() * 24) + 1
                });
            }
            return data;
        };

        setPulseData(generateInitialData());

        const interval = setInterval(() => {
            setPulseData(prevData => {
                const newData = [...prevData.slice(1)];
                const now = new Date();
                newData.push({
                    time: now.toLocaleTimeString(),
                    requests: Math.floor(Math.random() * 150) + 50,
                    entities: Math.floor(Math.random() * 24) + 1
                });
                return newData;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const healthItems = [
        { key: 'database', label: 'Database', icon: '🗄️' },
        { key: 'socketio', label: 'Socket.io', icon: '🔌' },
        { key: 'smtp', label: 'SMTP Service', icon: '📧' },
        { key: 'api', label: 'API Gateway', icon: '🌐' }
    ];

    return (
        <Box sx={{ flexGrow: 1, p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Global Dashboard
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Real-time platform overview across all 24 entities
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Real-time Pulse Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2, height: { xs: 360, md: '75vh' }, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h5" fontWeight="600" gutterBottom>
                            📊 Real-time Pulse
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            API requests across all entities (last 60 seconds)
                        </Typography>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={pulseData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis 
                                        dataKey="time" 
                                        stroke={theme.palette.text.secondary}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis 
                                        stroke={theme.palette.text.secondary}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: theme.palette.background.paper,
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 8
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="requests" 
                                        stroke={theme.palette.primary.main}
                                        strokeWidth={2}
                                        dot={false}
                                        name="API Requests"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="entities" 
                                        stroke={theme.palette.secondary.main}
                                        strokeWidth={2}
                                        dot={false}
                                        name="Active Entities"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Platform Health Grid */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2, height: { xs: 360, md: '75vh' }, overflow: 'auto' }}>
                        <Typography variant="h5" fontWeight="600" gutterBottom>
                            🏥 Platform Health
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            System service status
                        </Typography>
                        
                        <Grid container spacing={2}>
                            {healthItems.map((item) => (
                                <Grid item xs={12} key={item.key}>
                                    <Card 
                                        variant="outlined" 
                                        sx={{ 
                                            bgcolor: theme.palette.background.paper,
                                            borderColor: theme.palette.divider,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ py: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="h4">{item.icon}</Typography>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight="600">
                                                        {item.label}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {platformHealth[item.key].details}
                                                    </Typography>
                                                </Box>
                                                <Typography 
                                                    variant="body2" 
                                                    fontWeight="600"
                                                    sx={{ 
                                                        color: platformHealth[item.key].status.includes('🟢') ? 
                                                            theme.palette.success.main : theme.palette.error.main 
                                                    }}
                                                >
                                                    {platformHealth[item.key].status}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h5" fontWeight="600" gutterBottom>
                            📈 Platform Statistics
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color={theme.palette.primary.main} fontWeight="bold">
                                        24
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Entities
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color={theme.palette.success.main} fontWeight="bold">
                                        1,247
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Users
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color={theme.palette.warning.main} fontWeight="bold">
                                        89
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Tickets
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color={theme.palette.info.main} fontWeight="bold">
                                        99.9%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Uptime
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GlobalDashboard;
