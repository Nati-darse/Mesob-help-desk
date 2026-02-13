import { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, Select, MenuItem,
    FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Alert, CircularProgress
} from '@mui/material';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    TrendingUp as TrendingUpIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    Assignment as TicketIcon,
    Speed as PerformanceIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatCompanyLabel } from '../../../utils/companies';

const CrossTenantAnalytics = () => {
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('tickets');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analyticsData, setAnalyticsData] = useState({});
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/system-admin/cross-tenant-analytics', {
                    params: { timeRange }
                });
                setAnalyticsData(res.data || {});
                const companiesRes = await axios.get('/api/companies');
                setCompanies(companiesRes.data || []);
                setError('');
            } catch (error) {
                setAnalyticsData({});
                setError(error?.response?.data?.message || 'Failed to fetch analytics data.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [timeRange]);

    const ticketTrendDelta = useMemo(() => {
        const trends = analyticsData.ticketTrends || [];
        if (trends.length < 2) return null;
        const current = Number(trends[trends.length - 1]?.total || 0);
        const previous = Number(trends[trends.length - 2]?.total || 0);
        if (!previous) return null;
        const pct = ((current - previous) / previous) * 100;
        const sign = pct > 0 ? '+' : '';
        return `${sign}${pct.toFixed(1)}% vs previous period`;
    }, [analyticsData.ticketTrends]);

    const companyPerformanceRows = useMemo(() => {
        const rows = Array.isArray(analyticsData.companyPerformance) ? [...analyticsData.companyPerformance] : [];
        switch (selectedMetric) {
            case 'resolution':
                return rows.sort((a, b) => (a.avgResolution || Infinity) - (b.avgResolution || Infinity));
            case 'satisfaction':
                return rows.sort((a, b) => (b.satisfaction || 0) - (a.satisfaction || 0));
            case 'users':
                return rows.sort((a, b) => (b.users || 0) - (a.users || 0));
            case 'tickets':
            default:
                return rows.sort((a, b) => (b.tickets || 0) - (a.tickets || 0));
        }
    }, [analyticsData.companyPerformance, selectedMetric]);

    if (loading) {
        return (
            <Box sx={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    const MetricCard = ({ title, value, icon, trend, color }) => {
        const trendPositive = typeof trend === 'string' ? trend.trim().startsWith('+') : false;
        return (
        <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {value}
                        </Typography>
                        {trend && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUpIcon fontSize="small" color={trendPositive ? 'success' : 'error'} />
                                <Typography variant="caption" color={trendPositive ? 'success.main' : 'error.main'}>
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
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Cross-Tenant Analytics
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            label="Time Range"
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <MenuItem value="7d">Last 7 Days</MenuItem>
                            <MenuItem value="30d">Last 30 Days</MenuItem>
                            <MenuItem value="90d">Last 3 Months</MenuItem>
                            <MenuItem value="1y">Last Year</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Primary Metric</InputLabel>
                        <Select
                            value={selectedMetric}
                            label="Primary Metric"
                            onChange={(e) => setSelectedMetric(e.target.value)}
                        >
                            <MenuItem value="tickets">Ticket Volume</MenuItem>
                            <MenuItem value="resolution">Resolution Time</MenuItem>
                            <MenuItem value="satisfaction">Satisfaction</MenuItem>
                            <MenuItem value="users">User Activity</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                Analytics data is aggregated across all tenant organizations. Individual company data is anonymized for privacy.
            </Alert>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Organizations"
                        value={analyticsData.summary?.totalCompanies || 0}
                        icon={<BusinessIcon sx={{ color: '#1e4fb1' }} />}
                        color="#1e4fb1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Users"
                        value={analyticsData.summary?.totalUsers?.toLocaleString?.() || 0}
                        icon={<PeopleIcon sx={{ color: '#0061f2' }} />}
                        color="#0061f2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Tickets in Range"
                        value={analyticsData.summary?.totalTickets?.toLocaleString?.() || 0}
                        icon={<TicketIcon sx={{ color: '#3f51b5' }} />}
                        trend={ticketTrendDelta}
                        color="#3f51b5"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Avg Resolution"
                        value={`${analyticsData.summary?.avgResolution || 0}h`}
                        icon={<PerformanceIcon sx={{ color: '#00bcd4' }} />}
                        color="#00bcd4"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Ticket Trends Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Ticket Volume Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={analyticsData.ticketTrends || []}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e4fb1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#1e4fb1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#00bcd4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Tooltip />
                                <Area type="monotone" dataKey="total" stroke="#1e4fb1" fillOpacity={1} fill="url(#colorTotal)" />
                                <Area type="monotone" dataKey="resolved" stroke="#00bcd4" fillOpacity={1} fill="url(#colorResolved)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Category Distribution */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: { xs: 'auto', md: 400 } }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Issue Categories
                        </Typography>
                        <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                                <Pie
                                    data={analyticsData.categoryDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(analyticsData.categoryDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 2 }}>
                            {(analyticsData.categoryDistribution || []).map((item, index) => {
                                const total = (analyticsData.categoryDistribution || []).reduce((sum, cur) => sum + (cur.value || 0), 0);
                                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                return (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        bgcolor: item.color, 
                                        borderRadius: 1, 
                                        mr: 1 
                                    }} />
                                    <Typography variant="caption" sx={{ flex: 1 }}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {percent}%
                                    </Typography>
                                </Box>
                            )})}
                        </Box>
                    </Paper>
                </Grid>

                {/* Company Performance Table */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Organization Performance Comparison
                        </Typography>
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 700 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Organization</TableCell>
                                        <TableCell align="right">Tickets in Range</TableCell>
                                        <TableCell align="right">Active Users</TableCell>
                                        <TableCell align="right">Avg Resolution</TableCell>
                                        <TableCell align="right">Satisfaction</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {companyPerformanceRows.map((company, index) => {
                                        const meta = companies.find(c => String(c.companyId) === String(company.companyId));
                                        return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {meta ? formatCompanyLabel(meta) : `Company ${company.companyId}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">{company.tickets}</TableCell>
                                            <TableCell align="right">{company.users}</TableCell>
                                            <TableCell align="right">
                                                <Chip 
                                                    label={`${company.avgResolution}h`}
                                                    size="small"
                                                    color={company.avgResolution < 2 ? 'success' : 
                                                           company.avgResolution < 3 ? 'warning' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                                        {company.satisfaction}/5.0
                                                    </Typography>
                                                    <Box sx={{ 
                                                        width: 40, 
                                                        height: 6, 
                                                        bgcolor: 'grey.200', 
                                                        borderRadius: 3,
                                                        overflow: 'hidden'
                                                    }}>
                                                        <Box sx={{ 
                                                            width: `${(company.satisfaction / 5) * 100}%`, 
                                                            height: '100%', 
                                                            bgcolor: company.satisfaction > 4 ? 'success.main' : 
                                                                     company.satisfaction > 3.5 ? 'warning.main' : 'error.main'
                                                        }} />
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Top Performers */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Top Performers
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(analyticsData.topPerformers || []).length > 0 ? (
                                (analyticsData.topPerformers || []).map((performer, index) => {
                                    const meta = companies.find(c => String(c.companyId) === String(performer.companyId));
                                    return (
                                    <Card key={index} sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                {meta ? formatCompanyLabel(meta) : `Company ${performer.companyId}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                                {performer.metric}
                                            </Typography>
                                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                                {performer.value}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                )})
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No performer data available for the selected range.
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CrossTenantAnalytics;
