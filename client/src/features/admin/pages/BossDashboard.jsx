import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Typography, Box, Grid, Card, Paper, CircularProgress,
    Avatar, Chip, LinearProgress, IconButton, Tooltip, Alert
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    PieChart, Pie
} from 'recharts';
import {
    AccessTime as TimeIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Assignment as TicketIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getCompanyDisplayName } from '../../../utils/companies';
import { useAuth } from '../../auth/context/AuthContext';

const BossDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [realTimeData, setRealTimeData] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [companies, setCompanies] = useState([]);

    const fetchStats = useCallback(async () => {
        try {
            setRefreshing(true);
            const [statsRes, companiesRes] = await Promise.all([
                axios.get('/api/dashboard/admin-stats'),
                axios.get('/api/companies')
            ]);
            setStats(statsRes.data || {});
            setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
            setError('');
            setLastUpdate(new Date());
        } catch (fetchError) {
            console.error('Error fetching admin analytics data:', fetchError);
            setError(fetchError?.response?.data?.message || 'Failed to load analytics data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchStats]);

    // Real-time data polling
    useEffect(() => {
        const loadRealtime = async () => {
            try {
                const res = await axios.get('/api/dashboard/realtime');
                const now = new Date();
                const newData = {
                    time: now.toLocaleTimeString(),
                    requests: res.data.requestsPerMinute || 0,
                    activeUsers: res.data.activeUsers || 0
                };
                setRealTimeData(prev => [...prev, newData].slice(-20));
                setLastUpdate(now);
            } catch (error) {
                // ignore
            }
        };

        const interval = setInterval(loadRealtime, 5000);
        loadRealtime();
        return () => clearInterval(interval);
    }, []);

    const companyMap = useMemo(() => {
        const map = new Map();
        companies.forEach((company) => {
            const id = company.companyId ?? company.id;
            map.set(String(id), company);
        });
        return map;
    }, [companies]);

    // Prepare chart data from real API aggregation only
    const chartData = useMemo(() => {
        const byCompany = Array.isArray(stats?.ticketsByCompany) ? stats.ticketsByCompany : [];
        return byCompany
            .map((entry) => {
                const companyId = entry?._id;
                const meta = companyMap.get(String(companyId));
                return {
                    name: meta?.initials || `C${companyId}`,
                    fullName: meta ? getCompanyDisplayName(meta) : `Company ${companyId}`,
                    count: entry?.count || 0,
                    companyId
                };
            })
            .sort((a, b) => b.count - a.count);
    }, [stats, companyMap]);

    const scopeSubtitle = useMemo(() => {
        const isGlobalScope = ['Super Admin', 'System Admin'].includes(user?.role);
        if (isGlobalScope) return 'Real-time overview across all organizations';

        const currentCompany = companyMap.get(String(user?.companyId));
        if (currentCompany) {
            return `Real-time overview for ${getCompanyDisplayName(currentCompany)}`;
        }
        return 'Real-time overview for your organization';
    }, [user?.role, user?.companyId, companyMap]);

    const performanceMax = useMemo(() => {
        const resolvedValues = (stats?.technicianPerformance || []).map((tech) => tech?.resolved || 0);
        return Math.max(1, ...resolvedValues);
    }, [stats]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

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
                        {scopeSubtitle} | Last updated: {lastUpdate.toLocaleTimeString()}
                    </Typography>
                </Box>
                <Tooltip title="Refresh Data">
                    <IconButton
                        onClick={fetchStats}
                        disabled={refreshing}
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

            {error && (
                <Alert severity="error" sx={{ mb: 3, mx: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4, px: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Tickets"
                        value={stats?.totalTickets || 0}
                        subtitle="All time in current scope"
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
                        subtitle="Resolved since 00:00 today"
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
                        {chartData.length > 0 ? (
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
                        ) : (
                            <Box sx={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No ticket data found for the current scope.
                                </Typography>
                            </Box>
                        )}
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
                                        borderColor: activity.priority === 'Critical'
                                            ? 'error.main'
                                            : activity.priority === 'High'
                                                ? 'warning.main'
                                                : 'primary.main'
                                    }}>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {activity.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {activity.requester?.name || 'Unknown'} | {new Date(activity.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={`${activity.priority || 'N/A'} | ${activity.status}`}
                                            size="small"
                                            color={activity.status === 'Resolved' || activity.status === 'Closed' ? 'success' : 'primary'}
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
                                {(stats?.technicianPerformance || []).length > 0 ? (
                                    (stats?.technicianPerformance || []).map((tech) => (
                                        <Box key={tech.name} sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {tech.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {tech.resolved} tickets | {tech.avgTime}h avg
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(tech.resolved / performanceMax) * 100}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: 'grey.200'
                                                }}
                                            />
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 10 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No technician resolution data available yet.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default BossDashboard;
