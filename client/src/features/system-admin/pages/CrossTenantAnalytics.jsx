import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, Card, CardContent, Select, MenuItem,
    FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, Alert
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import {
    TrendingUp as TrendingUpIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    Assignment as TicketIcon,
    Speed as PerformanceIcon
} from '@mui/icons-material';
import { COMPANIES } from '../../../utils/companies';

const CrossTenantAnalytics = () => {
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('tickets');
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState({});

    // Mock data for demonstration
    const mockData = {
        companyPerformance: [
            { name: 'Ethio Telecom', tickets: 245, users: 89, avgResolution: 2.4, satisfaction: 4.2 },
            { name: 'Commercial Bank', tickets: 189, users: 67, avgResolution: 1.8, satisfaction: 4.5 },
            { name: 'Ethiopian Airlines', tickets: 156, users: 45, avgResolution: 3.1, satisfaction: 3.9 },
            { name: 'Awash Bank', tickets: 134, users: 38, avgResolution: 2.2, satisfaction: 4.1 },
            { name: 'Dashen Bank', tickets: 98, users: 29, avgResolution: 1.9, satisfaction: 4.3 }
        ],
        ticketTrends: [
            { month: 'Jan', total: 1240, resolved: 1180, pending: 60 },
            { month: 'Feb', total: 1356, resolved: 1298, pending: 58 },
            { month: 'Mar', total: 1189, resolved: 1145, pending: 44 },
            { month: 'Apr', total: 1445, resolved: 1389, pending: 56 },
            { month: 'May', total: 1298, resolved: 1256, pending: 42 },
            { month: 'Jun', total: 1567, resolved: 1523, pending: 44 }
        ],
        categoryDistribution: [
            { name: 'Hardware Issues', value: 35, color: '#1e4fb1' },
            { name: 'Software Problems', value: 28, color: '#0061f2' },
            { name: 'Network Issues', value: 20, color: '#3f51b5' },
            { name: 'Access Requests', value: 12, color: '#00bcd4' },
            { name: 'Other', value: 5, color: '#9c27b0' }
        ],
        topPerformers: [
            { company: 'Commercial Bank of Ethiopia', metric: 'Fastest Resolution', value: '1.8 hours avg' },
            { company: 'Dashen Bank', metric: 'Highest Satisfaction', value: '4.3/5.0 rating' },
            { company: 'Ethio Telecom', metric: 'Most Active', value: '245 tickets/month' },
            { company: 'Ethiopian Airlines', metric: 'Best Growth', value: '+23% improvement' }
        ]
    };

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setAnalyticsData(mockData);
            setLoading(false);
        }, 1000);
    }, [timeRange]);

    const MetricCard = ({ title, value, icon, trend, color }) => (
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

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Total Organizations"
                        value="24"
                        icon={<BusinessIcon sx={{ color: '#1e4fb1' }} />}
                        trend="+2 this month"
                        color="#1e4fb1"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Active Users"
                        value="1,247"
                        icon={<PeopleIcon sx={{ color: '#0061f2' }} />}
                        trend="+8.5% growth"
                        color="#0061f2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Monthly Tickets"
                        value="1,567"
                        icon={<TicketIcon sx={{ color: '#3f51b5' }} />}
                        trend="+12% vs last month"
                        color="#3f51b5"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Avg Resolution"
                        value="2.3h"
                        icon={<PerformanceIcon sx={{ color: '#00bcd4' }} />}
                        trend="-15% improvement"
                        color="#00bcd4"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Ticket Trends Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, height: 400 }}>
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
                    <Paper sx={{ p: 3, height: 400 }}>
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
                            {(analyticsData.categoryDistribution || []).map((item, index) => (
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
                                        {item.value}%
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Company Performance Table */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Organization Performance Comparison
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Organization</TableCell>
                                        <TableCell align="right">Monthly Tickets</TableCell>
                                        <TableCell align="right">Active Users</TableCell>
                                        <TableCell align="right">Avg Resolution</TableCell>
                                        <TableCell align="right">Satisfaction</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(analyticsData.companyPerformance || []).map((company, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {company.name}
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
                                    ))}
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
                            {(analyticsData.topPerformers || []).map((performer, index) => (
                                <Card key={index} sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {performer.company}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                            {performer.metric}
                                        </Typography>
                                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                            {performer.value}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CrossTenantAnalytics;