import { Container, Typography, Box, Button, Grid, Paper, Chip, Card, CardContent, Divider, Stack, Avatar } from '@mui/material';
import { Add as AddIcon, ConfirmationNumber as TicketIcon, AccessTime as TimeIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useTickets } from '../../tickets/hooks/useTickets';
import { getCompanyById } from '../../../utils/companies';
import TruncatedText from '../../../components/TruncatedText';
import { Newspaper as NewsIcon, Business as CompanyIcon } from '@mui/icons-material';
import React, { useMemo, memo } from 'react';

const StatCard = memo(({ icon, value, label, color }) => {
    return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: color, borderRadius: 3, display: 'flex', color: 'white' }}>
                        {icon}
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
});

const UserDashboard = () => {
    const { user } = useAuth();
    const { data: tickets = [], isLoading } = useTickets();

    const company = useMemo(() => getCompanyById(user?.companyId || 1), [user?.companyId]);
    const companyName = company.name;
    const companyInitials = company.initials;

    const activeTickets = useMemo(
        () => tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved'),
        [tickets]
    );
    const totalTicketsCount = tickets.length;
    const resolvedCount = useMemo(
        () => tickets.filter(t => t.status === 'Closed').length,
        [tickets]
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: { md: '60%' } }}>
                    <Avatar
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: 'primary.main',
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(30, 79, 177, 0.3)'
                        }}
                    >
                        {companyInitials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
                            Welcome back, {user?.name}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <TruncatedText
                                text={companyName}
                                variant="subtitle1"
                                sx={{ color: 'text.secondary', fontWeight: 600 }}
                                maxWidth="400px"
                            />
                            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                | Employee Portal
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/portal/new-ticket"
                    sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: '12px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        boxShadow: '0 10px 20px rgba(30, 79, 177, 0.2)'
                    }}
                >
                    New Support Ticket
                </Button>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<TicketIcon />} value={totalTicketsCount} label="Total Requests" color="primary.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<TimeIcon />} value={activeTickets.length} label="Active Tickets" color="warning.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<CheckIcon />} value={resolvedCount} label="Resolved Today" color="success.main" />
                </Grid>
            </Grid>

            {/* Tenant Specific News and Active Tickets */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                        Bureau News
                    </Typography>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, height: 'fit-content', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#112240' : '#f8f9fa' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: 'primary.main' }}>
                                <NewsIcon />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Latest Updates</Typography>
                            </Box>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Internal Memo</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>Annual IT System Maintenance</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Scheduled for this weekend. Please backup your local files.</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>New Policy</Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>Remote Access Security Update</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>All {companyInitials} employees must enable 2FA by Friday.</Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 3, color: 'white', textAlign: 'center' }}>
                                    <Typography variant="button" sx={{ fontWeight: 700 }}>View All {companyInitials} Announcements</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                        My Active Tickets
                    </Typography>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        {isLoading ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">Loading tickets...</Typography>
                            </Box>
                        ) : activeTickets.length === 0 ? (
                            <Box sx={{ p: 8, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>No active tickets</Typography>
                                <Typography variant="body2" color="text.secondary">Everything looks good! If you need help, create a new ticket.</Typography>
                            </Box>
                        ) : (
                            <Box>
                                {activeTickets.map((ticket, index) => (
                                    <Box key={ticket._id}>
                                        <Box
                                            component={RouterLink}
                                            to={`/portal/tickets/${ticket._id}`}
                                            sx={{
                                                p: 3,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                transition: 'background-color 0.2s',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            <Stack spacing={0.5}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    #{ticket._id.slice(-6).toUpperCase()} • {ticket.category}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Chip
                                                    label={ticket.status}
                                                    size="small"
                                                    color={ticket.status === 'New' ? 'primary' : 'info'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        {index < activeTickets.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default UserDashboard;
