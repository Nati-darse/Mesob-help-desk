import { Container, Typography, Box, Button, Grid, Paper, Chip, Card, CardContent, Divider, Stack, Avatar } from '@mui/material';
import { Add as AddIcon, ConfirmationNumber as TicketIcon, AccessTime as TimeIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useTickets } from '../../tickets/hooks/useTickets';
import { getCompanyById, getCompanyDisplayName } from '../../../utils/companies';
import TruncatedText from '../../../components/TruncatedText';
import { Newspaper as NewsIcon, Business as CompanyIcon, NotificationsActive as AlertIcon } from '@mui/icons-material';
import React, { useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getStatusColor } from '../../../utils/ticketStatus';

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
    const { t } = useTranslation();
    const { data: tickets = [], isLoading } = useTickets();

    const company = useMemo(() => getCompanyById(user?.companyId || 1), [user?.companyId]);
    const companyName = getCompanyDisplayName(company);
    const companyInitials = company.initials;

    const activeTickets = useMemo(
        () => tickets.filter(t => t.status !== 'Closed' && (t.status !== 'Resolved' || t.reviewStatus === 'Pending')),
        [tickets]
    );
    const totalTicketsCount = tickets.length;
    const resolvedCount = useMemo(
        () => tickets.filter(t => t.status === 'Closed').length,
        [tickets]
    );

    // Fetch Notifications
    const { data: notifications = [] } = useQuery(['notifications'], async () => {
        const res = await axios.get('/api/notifications');
        return res.data;
    });

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
                            {t('userDashboard.welcomeBack', { name: user?.name })}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                            <TruncatedText
                                text={companyName}
                                variant="subtitle1"
                                sx={{ color: 'text.secondary', fontWeight: 600 }}
                                maxWidth="400px"
                            />
                            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                | {t('userDashboard.employeePortal')}
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
                        boxShadow: '0 10px 20px rgba(30, 79, 177, 0.2)',
                        width: { xs: '100%', md: 'auto' }
                    }}
                >
                    {t('userDashboard.newSupportTicket')}
                </Button>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<TicketIcon />} value={totalTicketsCount} label={t('userDashboard.totalRequests')} color="#1e4fb1" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<TimeIcon />} value={activeTickets.length} label={t('userDashboard.activeTickets')} color="#0061f2" />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard icon={<CheckIcon />} value={resolvedCount} label={t('userDashboard.resolvedToday')} color="#42a5f5" />
                </Grid>
            </Grid>

            {/* Tenant Specific News and Active Tickets */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                        {t('userDashboard.announcements')}
                    </Typography>
                    <Card
                        elevation={0}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            height: 'fit-content',
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.default
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: 'primary.main' }}>
                                <AlertIcon />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('userDashboard.latestUpdates')}</Typography>
                            </Box>
                            <Stack spacing={3}>
                                {notifications.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="body2" color="text.secondary">{t('userDashboard.noAnnouncements')}</Typography>
                                    </Box>
                                ) : (
                                    notifications.map((note) => (
                                        <Box key={note._id || note.id || Math.random()}>
                                            <Typography
                                                variant="caption"
                                                color={note.priority === 'error' ? 'error.main' : note.priority === 'warning' ? 'warning.main' : 'info.main'}
                                                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block' }}
                                            >
                                                {note.priority || 'Info'} {t('userDashboard.alert')}
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5 }}>
                                                {note.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {note.createdAt ? new Date(note.createdAt).toLocaleString() : t('userDashboard.justNow')}
                                            </Typography>
                                            <Divider sx={{ mt: 2 }} />
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                        {t('userDashboard.myActiveTickets')}
                    </Typography>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden' }}>
                        {isLoading ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">{t('userDashboard.loadingTickets')}</Typography>
                            </Box>
                        ) : activeTickets.length === 0 ? (
                            <Box sx={{ p: 8, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>{t('userDashboard.noActiveTickets')}</Typography>
                                <Typography variant="body2" color="text.secondary">{t('userDashboard.everythingGood')}</Typography>
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
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                justifyContent: 'space-between',
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: 2,
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
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                                                <Chip
                                                    label={ticket.status}
                                                    size="small"
                                                    color={getStatusColor(ticket.status)}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                                {ticket.reviewStatus === 'Pending' && (
                                                    <Chip
                                                        label="Pending Admin Review"
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                )}
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
