import React, { useState, useMemo } from 'react';
import {
    Container, Grid, Box, Typography, Paper, Card, CardContent,
    Avatar, Chip, Button, IconButton, Badge, Stack,
    Divider, Tooltip, LinearProgress, List, ListItem,
    ListItemAvatar, ListItemText, ListItemSecondaryAction,
    Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, useTheme, Alert
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    AssignmentInd as AssignIcon,
    Engineering as TechIcon,
    History as ActivityIcon,
    TrendingUp as TrendIcon,
    Speed as SpeedIcon,
    NotificationImportant as UrgentIcon,
    CheckCircle as DoneIcon,
    Refresh as RefreshIcon,
    Bolt as InstantIcon,
    Lan as NodeIcon,
    Groups as TeamIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { getCompanyById } from '../../../utils/companies';
import { useTranslation } from 'react-i18next';

const AdminCommandCenter = () => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const socketRef = React.useRef(null);

    // Socket Synchronization
    React.useEffect(() => {
        if (user) {
            const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
                transports: ['websocket'],
                auth: { companyId: user.companyId },
                extraHeaders: { 'x-tenant-id': String(user.companyId || '') }
            });

            socketRef.current = socket;
            socket.emit('join_company', user.companyId);

            socket.on('technician_status_updated', (updatedTech) => {
                queryClient.setQueryData(['admin-stats'], (prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        technicians: prev.technicians?.map(t =>
                            t._id === updatedTech._id ? { ...t, ...updatedTech } : t
                        )
                    };
                });
            });

            socket.on('ticket_updated', () => {
                queryClient.invalidateQueries(['tickets']);
                queryClient.invalidateQueries(['admin-stats']);
            });

            return () => socket.disconnect();
        }
    }, [user, queryClient]);

    const getStatusBadge = (tech) => {
        const status = tech.dutyStatus || (tech.isAvailable ? 'Online' : 'Offline');
        switch (status) {
            case 'Online': return <Chip label="Online" color="success" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />;
            case 'On-Site': return <Chip label="On-Site" color="primary" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />;
            case 'Break': return <Chip label="On Break" color="warning" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />;
            case 'Offline': return <Chip label="Offline" color="error" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />;
            default: return <Chip label={status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />;
        }
    };

    // Queries
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await axios.get('/api/dashboard/admin-stats');
            return res.data;
        },
        refetchInterval: 5000 // Real-time pulse
    });

    const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
        queryKey: ['tickets', 'all'],
        queryFn: async () => {
            const res = await axios.get('/api/tickets?pageSize=100');
            return res.data;
        },
        refetchInterval: 5000
    });

    // Assignment Mutation
    const assignMutation = useMutation({
        mutationFn: async ({ ticketId, technicianId }) => {
            return await axios.put(`/api/tickets/${ticketId}/assign`, { technicianId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-stats']);
            queryClient.invalidateQueries(['tickets']);
            setAssignDialogOpen(false);
            setSelectedTicket(null);
        }
    });

    // Derived State
    const unassignedTickets = useMemo(() =>
        tickets.filter(t => t.status === 'New' || !t.technician),
        [tickets]);

    const onlineTechs = useMemo(() =>
        stats?.technicians?.filter(t => t.isAvailable) || [],
        [stats]);

    const pendingReviewTickets = useMemo(() =>
        tickets.filter(t => t.status === 'Resolved' && t.reviewStatus === 'Pending'),
        [tickets]);

    const handleOpenAssign = (ticket) => {
        setSelectedTicket(ticket);
        setAssignDialogOpen(true);
    };

    const handleConfirmAssignment = (techId) => {
        assignMutation.mutate({
            ticketId: selectedTicket._id,
            technicianId: techId
        });
    };

    if (statsLoading) return <LinearProgress />;

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#f8fafd', // Soft light professional blue-white
            pt: 4, pb: 8,
            backgroundImage: 'radial-gradient(circle at 2px 2px, #e1e4e8 1px, transparent 0)',
            backgroundSize: '40px 40px'
        }}>
            <Container maxWidth="xl">
                {/* Header Section */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{
                                bgcolor: '#1a237e',
                                p: 1, borderRadius: 2,
                                display: 'flex',
                                boxShadow: '0 4px 20px rgba(26, 35, 126, 0.2)'
                            }}>
                                <DashboardIcon sx={{ color: 'white' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, color: '#1a237e' }}>
                                {t('adminCommandCenter.commandCenter')}
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 7 }}>
                            {t('adminCommandCenter.unifiedMissionControl')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<AssignmentIcon />}
                            component={RouterLink}
                            to="/admin/reports"
                            sx={{ borderRadius: 3, fontWeight: 700, borderColor: '#1a237e', color: '#1a237e' }}
                        >
                            📊 {t('nav.reports')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<AssignmentIcon />}
                            component={RouterLink}
                            to="/admin/reviews"
                            sx={{ borderRadius: 3, fontWeight: 700, borderColor: '#1a237e', color: '#1a237e' }}
                        >
                            {t('admin.reviewQueue')} ({pendingReviewTickets.length})
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => refetchStats()}
                            sx={{ borderRadius: 3, fontWeight: 700, borderColor: '#1a237e', color: '#1a237e' }}
                        >
                            {t('adminCommandCenter.syncCloud')}
                        </Button>
                    </Box>
                </Box>

                {/* KPI Tier */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: t('adminCommandCenter.liveRequests'), value: stats?.openTickets || 0, icon: <UrgentIcon />, color: '#d32f2f', path: '/admin/dashboard' },
                        { label: t('adminCommandCenter.unassigned'), value: stats?.unassignedTickets || 0, icon: <AssignIcon />, color: '#ed6c02', path: '/admin/assign' },
                        { label: t('adminCommandCenter.onlineTechs'), value: onlineTechs.length, icon: <TechIcon />, color: '#2e7d32' },
                        { label: t('adminCommandCenter.pendingReview'), value: pendingReviewTickets.length, icon: <DoneIcon />, color: '#0288d1', path: '/admin/reviews' }
                    ].map((kpi, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={idx}>
                            <Paper
                                elevation={0}
                                component={kpi.path ? RouterLink : 'div'}
                                to={kpi.path}
                                sx={{
                                    p: 3, borderRadius: 4, bgcolor: 'white',
                                    border: '1px solid #eef2f6',
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textDecoration: 'none',
                                    cursor: kpi.path ? 'pointer' : 'default',
                                    '&:hover': kpi.path ? {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                                        borderColor: kpi.color,
                                        '& .kpi-icon': { bgcolor: kpi.color, color: 'white' }
                                    } : {}
                                }}
                            >
                                <Box className="kpi-icon" sx={{
                                    p: 1.5, borderRadius: 3,
                                    bgcolor: `${kpi.color}15`,
                                    color: kpi.color,
                                    display: 'flex',
                                    transition: 'all 0.3s'
                                }}>
                                    {kpi.icon}
                                </Box>
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                        {kpi.label}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={900} color="text.primary">
                                        {kpi.value}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Main Control Grid */}
                <Grid container spacing={4}>
                    {/* Live Dispatch Inbox */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 4, borderRadius: 5, bgcolor: '#fff', border: '1px solid #e0e6ed', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#1a237e' }}>
                                    <NodeIcon color="primary" /> {t('adminCommandCenter.liveDispatchInbox')}
                                </Typography>
                                <Typography variant="caption" sx={{ bgcolor: '#1a237e', color: 'white', px: 2, py: 0.5, borderRadius: 5, fontWeight: 700 }}>
                                    {unassignedTickets.length} {t('adminCommandCenter.pendingAction')}
                                </Typography>
                            </Box>

                            <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {unassignedTickets.map((ticket) => (
                                    <ListItem
                                        key={ticket._id}
                                        sx={{
                                            bgcolor: '#f8f9fa',
                                            borderRadius: 4,
                                            border: '1px solid #edf2f7',
                                            p: 2,
                                            transition: '0.2s',
                                            '&:hover': { bgcolor: '#fff', borderColor: '#1a237e', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 80 }}>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                badgeContent={<Box sx={{ width: 12, height: 12, bgcolor: ticket.priority === 'Critical' ? 'error.main' : 'warning.main', borderRadius: '50%', border: '2px solid white' }} />}
                                            >
                                                <Avatar sx={{ bgcolor: 'white', color: 'text.primary', border: '1px solid #eee' }}>
                                                    {getCompanyById(ticket.companyId)?.initials || '??'}
                                                </Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                    {ticket.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Stack spacing={0.5} sx={{ mt: 1 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getCompanyById(ticket.companyId)?.name} • {ticket.category}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            label={ticket.priority}
                                                            size="small"
                                                            color={ticket.priority === 'Critical' ? 'error' : 'default'}
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(ticket.createdAt).toLocaleTimeString()} · {ticket.buildingWing || t('adminCommandCenter.general')}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            }
                                        />
                                        <ListItemSecondaryAction sx={{ right: 24 }}>
                                            <Button
                                                variant="contained"
                                                onClick={() => handleOpenAssign(ticket)}
                                                sx={{
                                                    borderRadius: 3,
                                                    px: 3,
                                                    fontWeight: 800,
                                                    bgcolor: '#1a237e',
                                                    '&:hover': { bgcolor: '#0d1442', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.2)' }
                                                }}
                                            >
                                                {t('adminCommandCenter.dispatch')}
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                                {unassignedTickets.length === 0 && (
                                    <Box sx={{ py: 10, textAlign: 'center' }}>
                                        <DoneIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                                        <Typography color="text.secondary" fontWeight={700}>{t('adminCommandCenter.allClear')}</Typography>
                                    </Box>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Technician Monitor */}
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 4, borderRadius: 5, bgcolor: '#fff', border: '1px solid #e0e6ed', height: '100%' }}>
                            <Typography variant="h5" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5, color: '#1a237e' }}>
                                <TechIcon color="success" /> {t('adminCommandCenter.workforceStatus')}
                            </Typography>
                            <List>
                                {stats?.technicians?.map((tech) => (
                                    <ListItem key={tech._id} sx={{ px: 0, mb: 3 }}>
                                        <ListItemAvatar>
                                            <Badge
                                                color={tech.isAvailable ? 'success' : 'error'}
                                                variant="dot"
                                                overlap="circular"
                                                sx={{ '& .MuiBadge-badge': { width: 14, height: 14, borderRadius: '50%', border: '2px solid white' } }}
                                            >
                                                <Avatar sx={{ bgcolor: '#1a237e', fontWeight: 800 }}>{tech.name.charAt(0)}</Avatar>
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Typography fontWeight={800} color="text.primary">{tech.name}</Typography>}
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">{tech.department || 'IT Operations'}</Typography>
                                                        {getStatusBadge(tech)}
                                                    </Stack>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={tech.isAvailable ? 100 : 30}
                                                        sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: tech.isAvailable ? '#4caf50' : '#ff9800' } }}
                                                    />
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Dispatch Dialog */}
            <Dialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 5, p: 2 } }}
            >
                <DialogTitle sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={900}>{t('adminCommandCenter.quickDispatch')}</Typography>
                    <Typography color="text.secondary" variant="body2">{t('adminCommandCenter.assigning', { title: selectedTicket?.title })}</Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ mb: 2, display: 'block' }}>
                        {t('adminCommandCenter.availablePersonnel', { count: onlineTechs.length })}
                    </Typography>
                    <Stack spacing={2}>
                        {onlineTechs.map(tech => (
                            <Paper
                                key={tech._id}
                                onClick={() => handleConfirmAssignment(tech._id)}
                                sx={{
                                    p: 2, borderRadius: 3, border: '1px solid #eee',
                                    cursor: 'pointer', transition: '0.2s',
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    '&:hover': { bgcolor: '#1a237e', color: 'white', borderColor: '#1a237e' }
                                }}
                            >
                                <Avatar sx={{ bgcolor: '#eee', color: '#1a237e' }}>{tech.name.charAt(0)}</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography fontWeight={800}>{tech.name}</Typography>
                                        {getStatusBadge(tech)}
                                    </Box>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{t('adminCommandCenter.readyForDispatch')}</Typography>
                                </Box>
                                <InstantIcon />
                            </Paper>
                        ))}
                        {onlineTechs.length === 0 && (
                            <Alert severity="warning">{t('adminCommandCenter.noTechniciansAvailable')}</Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ pb: 3, px: 3 }}>
                    <Button fullWidth onClick={() => setAssignDialogOpen(false)} sx={{ fontWeight: 800 }}>{t('adminCommandCenter.abortMission')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminCommandCenter;
