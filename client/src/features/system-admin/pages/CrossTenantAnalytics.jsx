import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    Button, IconButton, Tooltip
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { getCompanyById } from '../../../utils/companies';

const CrossTenantAnalytics = () => {
    const theme = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/system-admin/analytics/cross-tenant');
            setAnalytics(response.data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportAnalytics = async () => {
        try {
            const response = await axios.get('/api/system-admin/analytics/export', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cross-tenant-analytics-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!analytics) {
        return (
            <Alert severity="error">Failed to load analytics data</Alert>
        );
    }

    // Transform data for charts
    const ticketChartData = analytics.ticketsByCompany.map(item => ({
        company: getCompanyById(item._id)?.name || `Company ${item._id}`,
        tickets: item.totalTickets,
        avgResolution: Math.round(item.avgResolutionTime || 0)
    }));

    const userChartData = analytics.usersByCompany.map(item => ({
        company: getCompanyById(item._id)?.name || `Company ${item._id}`,
        total: item.totalUsers,
        active: item.activeUsers
    }));

    const activityPieData = analytics.activityByCompany.map((item, index) => ({
        name: getCompanyById(item._id)?.name || `Company ${item._id}`,
        value: item.activityCount,
        color: COLORS[index % COLORS.length]
    }));

    return (
        <Box maxWidth="1600px" margin="0 auto">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                        📊 Cross-Tenant Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive analytics across all organizations • Last updated: {lastUpdate.toLocaleTimeString()}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchAnalytics} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={exportAnalytics}
                        color="secondary"
                    >
                        Export Report
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {analytics.ticketsByCompany.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Organizations
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AssignmentIcon sx={{ fontSize: 40, color: 'success.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {analytics.ticketsByCompany.reduce((sum, item) => sum + item.totalTickets, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Tickets
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PeopleIcon sx={{ fontSize: 40, color: 'info.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {analytics.usersByCompany.reduce((sum, item) => sum + item.totalUsers, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Users
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {analytics.activityByCompany.reduce((sum, item) => sum + item.activityCount, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        24h Activity
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Tickets by Company Chart */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Tickets by Organization
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ticketChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="company" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="tickets" fill={theme.palette.primary.main} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Activity Distribution Pie Chart */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            24h Activity Distribution
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activityPieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {activityPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Users by Company Chart */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            User Distribution by Organization
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="company" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="total" fill={theme.palette.info.main} name="Total Users" />
                                <Bar dataKey="active" fill={theme.palette.success.main} name="Active Users" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Detailed Tables */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Ticket Performance by Organization
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Organization</TableCell>
                                        <TableCell align="right">Total Tickets</TableCell>
                                        <TableCell align="right">Avg Resolution (hrs)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analytics.ticketsByCompany.map((row) => (
                                        <TableRow key={row._id}>
                                            <TableCell>
                                                {getCompanyById(row._id)?.name || `Company ${row._id}`}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip 
                                                    label={row.totalTickets} 
                                                    size="small" 
                                                    color="primary" 
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {Math.round(row.avgResolutionTime || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            User Activity by Organization
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Organization</TableCell>
                                        <TableCell align="right">Total Users</TableCell>
                                        <TableCell align="right">Active Users</TableCell>
                                        <TableCell align="right">Activity Rate</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analytics.usersByCompany.map((row) => (
                                        <TableRow key={row._id}>
                                            <TableCell>
                                                {getCompanyById(row._id)?.name || `Company ${row._id}`}
                                            </TableCell>
                                            <TableCell align="right">{row.totalUsers}</TableCell>
                                            <TableCell align="right">
                                                <Chip 
                                                    label={row.activeUsers} 
                                                    size="small" 
                                                    color="success" 
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {Math.round((row.activeUsers / row.totalUsers) * 100)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CrossTenantAnalytics;