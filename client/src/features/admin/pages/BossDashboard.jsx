import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Card, CardContent, Paper, CircularProgress,
    Avatar, Chip, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    LineChart, Line, Area, AreaChart, PieChart, Pie
} from 'recharts';
import {
    TrendingUp as TrendingIcon,
    AccessTime as TimeIcon,
    Engineering as TechIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    People as PeopleIcon,
    Assignment as TicketIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById } from '../../../utils/companies';

const BossDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [realTimeData, setRealTimeData] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/dashboard/admin-stats');
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                // Use mock data for demo
                setStats({
                    totalTickets: 1247,
                    openTickets: 89,
                    resolvedToday: 45,
                    avgResolutionTime: 2.3,
                    ticketsByCompany: COMPANIES.map(company => ({
                        _id: company.id,
                        count: Math.floor(Math.random() * 50) + 10
                    })),
                    ticketsByPriority: [
                        { priority: 'Critical', count: 12, color: '#f44336' },
                        { priority: 'High', count: 34, color: '#ff9800' },
                        { priority: 'Medium', count: 78, color: '#2196f3' },
                        { priority: 'Low', count: 145, color: '#4caf50' }
                    ],
                    technicianPerformance: [
                        { name: 'Tech A', resolved: 23, avgTime: 1.8 },
                        { name: 'Tech B', resolved: 19, avgTime: 2.1 },
                        { name: 'Tech C', resolved: 31, avgTime: 1.5 },
                        { name: 'Tech D', resolved: 27, avgTime: 2.4 }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Real-time data simulation
    useEffect(() => {
        const generateRealTimeData = () => {
            const now = new Date();
            const newData = {
                time: now.toLocaleTimeString(),
                requests: Math.floor(Math.random() * 100) + 50,
                activeUsers: Math.floor(Math.random() * 200) + 100
            };

            setRealTimeData(prev => {
                const updated = [...prev, newData];
                return updated.slice(-20); // Keep last 20 data points
            });

            setLastUpdate(now);
        };

        const interval = setInterval(generateRealTimeData, 5000);
        generateRealTimeData(); // Initial data

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    // Prepare chart data
    const chartData = COMPANIES.map(company => {
        const companyTickets = stats?.ticketsByCompany?.find(t => t._id === company.id);
        return {
            name: company.initials,
            fullName: company.name,
            count: companyTickets?.count || 0,
            companyId: company.id
        };
    });

    const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
        <Card sx={{
            p: 3,
            height: '100%',
            background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
            borderLeft: `4px solid ${color}`
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: color, color: 'white', mr: 2 }}>
                    {icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color={color}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {title}
                    </Typography>
                </Box>
                {trend && (
                    <Chip
                        label={trend > 0 ? `+${trend}%` : `${trend}%`}
                        color={trend > 0 ? 'success' : 'error'}
                        size="small"
                    />
                )}
            </Box>
            <Typography variant="caption" color="text.secondary">
                {subtitle}
            </Typography>
        </Card>
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4, px: 2 }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Analytics Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Real-time overview of all 24 entities • Last updated: {lastUpdate.toLocaleTimeString()}
                    </Typography>
                </Box>
                <Tooltip title="Refresh Data">
                    <IconButton
                        onClick={() => window.location.reload()}
                        sx={{
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4, px: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Tickets"
                        value={stats?.totalTickets || 0}
                        subtitle="All time across all entities"
                        icon={<TicketIcon />}
                        color="#1e4fb1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Open Tickets"
                        value={stats?.openTickets || 0}
                        subtitle="Awaiting resolution"
                        icon={<WarningIcon />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Resolved Today"
                        value={stats?.resolvedToday || 0}
                        subtitle="Completed in last 24h"
                        icon={<CheckIcon />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Avg Resolution Time"
                        value={`${stats?.avgResolutionTime || 0}h`}
                        subtitle="Across all technicians"
                        icon={<TimeIcon />}
                        color="#0061f2"
                    />
                </Grid>
            </Grid>

            {/* Row 1 - Tickets by Company (90% width, centered) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ width: '90%', maxWidth: '100%' }}>
                    <Paper sx={{ height: { xs: 'auto', md: 500 }, overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Tickets by Company
                            </Typography>
                        </Box>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis />
                                <RechartsTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {data.fullName}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Tickets: {data.count}
                                                    </Typography>
                                                </Box>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" fill="#1e4fb1" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(${index * 15}, 70%, 50%)`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Box>
            </Box>

            {/* Row 2 - Recent Activity (90% width, centered) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ width: '90%', maxWidth: '100%' }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Recent Operational Activity
                        </Typography>
                        <Box sx={{ height: 300, overflowY: 'auto' }}>
                            {stats?.recentActivity?.length > 0 ? (
                                stats.recentActivity.map((activity, idx) => (
                                    <Box key={idx} sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: 2,
                                        mb: 1,
                                        bgcolor: 'action.hover',
                                        borderRadius: 2,
                                        borderLeft: '4px solid',
                                        borderColor: activity.status === 'Critical' ? 'error.main' : 'primary.main'
                                    }}>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {activity.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {activity.requester?.name || 'Unknown'} • {new Date(activity.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={activity.status}
                                            size="small"
                                            color={activity.status === 'Resolved' ? 'success' : 'primary'}
                                            variant="outlined"
                                        />
                                    </Box>
                                ))
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <Typography variant="body2" color="text.secondary">No recent activity detected.</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Row 3 - Priority & Top Performers (45% + 45% with space, centered in 90%) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ width: '90%', maxWidth: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 45%' } }}>
                        <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 }, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Priority Distribution
                            </Typography>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={stats?.ticketsByPriority || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="count"
                                        >
                                            {(stats?.ticketsByPriority || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    {(stats?.ticketsByPriority || []).map((item) => (
                                        <Box key={item.priority} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 12, height: 12, bgcolor: item.color, mr: 1, borderRadius: 1 }} />
                                            <Typography variant="body2">
                                                {item.priority}: {item.count}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Box>

                    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 45%' } }}>
                        <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Top Performers
                            </Typography>
                            <Box sx={{ height: 320, overflowY: 'auto' }}>
                                {stats?.technicianPerformance?.map((tech, index) => (
                                    <Box key={tech.name} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {tech.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {tech.resolved} tickets • {tech.avgTime}h avg
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(tech.resolved / 35) * 100}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: 'grey.200'
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default BossDashboard;
