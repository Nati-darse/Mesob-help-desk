import { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Card, CardContent } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../features/auth/context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch stats');
            }
        };
        fetchStats();
    }, []);

    if (!stats || !stats.priorityStats) return <Typography sx={{ p: 4 }}>Loading Dashboard...</Typography>;
    if (stats.message) return <Typography color="error" sx={{ p: 4 }}>Error: {stats.message}</Typography>;

    const priorityData = {
        labels: (stats.priorityStats || []).map(s => s._id),
        datasets: [{
            data: (stats.priorityStats || []).map(s => s.count),
            backgroundColor: ['#1e4fb1', '#4caf50', '#ff9800', '#f44336'],
            borderWidth: 1,
        }],
    };

    const categoryData = {
        labels: (stats.categoryStats || []).map(s => s._id),
        datasets: [{
            label: 'Tickets by Category',
            data: (stats.categoryStats || []).map(s => s.count),
            backgroundColor: '#1e4fb1',
            borderRadius: 4,
        }],
    };

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
                Dashboard Overview
            </Typography>

            <Grid container spacing={3}>
                {/* Stat Cards */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Tickets</Typography>
                            <Typography variant="h4">{stats.totalTickets}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Open Tickets</Typography>
                            <Typography variant="h4" color="primary">{stats.openTickets}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Resolved</Typography>
                            <Typography variant="h4" color="success.main">{stats.resolvedTickets}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Closed</Typography>
                            <Typography variant="h4" color="text.disabled">{stats.closedTickets}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Charts */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Tickets by Priority</Typography>
                        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                            <Pie data={priorityData} options={{ maintainAspectRatio: false }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Tickets by Category</Typography>
                        <Box sx={{ height: 300 }}>
                            <Bar data={categoryData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
