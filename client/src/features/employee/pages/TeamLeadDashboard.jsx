import React, { useState, useMemo } from 'react';
import {
    Container, Box, Typography, Paper, Grid, TextField, Button, Chip,
    Stack, Card, CardContent, FormControl, InputLabel, Select, MenuItem, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions, Rating, Avatar, Badge, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    History as HistoryIcon,
    FlashOn as InstantIcon,
    CheckCircle as DoneIcon,
    SentimentVerySatisfied as FeedbackIcon,
    Person as TechIcon,
    FmdGood as LocationIcon,
    Category as CategoryIcon,
    PriorityHigh as PriorityIcon,
    Description as DescriptionIcon,
    Business as BuildingIcon,
    Search as SearchIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { useTickets } from '../../tickets/hooks/useTickets';
import { getCompanyById } from '../../../utils/companies';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['Software', 'Hardware', 'Network', 'Account', 'Building', 'Other'];

const TeamLeadDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { data: tickets = [], refetch } = useTickets();
    const company = useMemo(() => getCompanyById(user?.companyId || 1), [user?.companyId]);

    // Form State
    const [requestData, setRequestData] = useState({
        title: '',
        description: '',
        floor: '',
        category: 'Hardware', // Default
        priority: 'Medium'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback Dialog State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const activeTickets = tickets.filter(t => t.status !== 'Closed');

    // Stats
    const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
    const pendingCount = activeTickets.filter(t => t.status !== 'Resolved').length;

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        if (!requestData.title || !requestData.floor) return;

        if (!user) {
            alert(t('teamLeadDashboard.sessionExpired'));
            return;
        }

        console.log('Submitting ticket with user:', user);
        setIsSubmitting(true);
        try {
            await axios.post('/api/tickets', {
                title: requestData.title,
                description: requestData.description || `Request from Team Leader ${user?.name}`,
                category: requestData.category,
                priority: requestData.priority,
                buildingWing: `Floor: ${requestData.floor}`,
                companyId: user.companyId
            });
            setRequestData({
                title: '',
                description: '',
                floor: '',
                category: 'Hardware',
                priority: 'Medium'
            });
            refetch();
        } catch (error) {
            console.error('Submission error:', error);
            const serverMessage = error.response?.data?.message || error.message;
            alert(t('teamLeadDashboard.failedToSubmit') + ' ' + serverMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenFeedback = (ticket) => {
        setSelectedTicket(ticket);
        setFeedbackOpen(true);
    };

    const handleSubmitFeedback = async () => {
        try {
            await axios.put(`/api/tickets/${selectedTicket._id}/rate`, {
                rating,
                feedback: comment
            });
            setFeedbackOpen(false);
            setRating(5);
            setComment('');
            refetch();
        } catch (error) {
            console.error(error);
            alert(t('teamLeadDashboard.failedToSubmitFeedback'));
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'error';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            case 'Low': return 'success';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#1A237E', mb: 1, fontSize: { xs: '2rem', sm: '3rem' } }}>
                    {t('teamLeadDashboard.teamOperationsCenter')}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    {t('teamLeadDashboard.manageRequests', { company: company.name, initials: company.initials })}
                </Typography>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#E3F2FD', borderRadius: 3, boxShadow: 'none' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h2" sx={{ fontWeight: 800, color: '#1565C0' }}>
                                {activeTickets.length}
                            </Typography>
                            <Typography variant="overline" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>
                                {t('teamLeadDashboard.activeRequests')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#E8F5E9', borderRadius: 3, boxShadow: 'none' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h2" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                                {resolvedCount}
                            </Typography>
                            <Typography variant="overline" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>
                                {t('teamLeadDashboard.needsConfirmation')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#FFF3E0', borderRadius: 3, boxShadow: 'none' }}>
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h2" sx={{ fontWeight: 800, color: '#EF6C00' }}>
                                {pendingCount}
                            </Typography>
                            <Typography variant="overline" sx={{ letterSpacing: 1, fontWeight: 'bold' }}>
                                {t('teamLeadDashboard.pendingAction')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* New Full Width Request Form */}
            <Box sx={{ mb: 5 }}>
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '6px',
                        background: 'linear-gradient(90deg, #1A237E 0%, #0D47A1 100%)'
                    }} />

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddIcon sx={{ color: 'primary.main' }} /> {t('teamLeadDashboard.newSupportRequest')}
                    </Typography>

                    <form onSubmit={handleQuickSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    label={t('teamLeadDashboard.issueTitle')}
                                    placeholder={t('teamLeadDashboard.brieflyDescribe')}
                                    value={requestData.title}
                                    onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><InstantIcon color="action" /></InputAdornment>,
                                    }}
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label={t('teamLeadDashboard.floorRoom')}
                                    value={requestData.floor}
                                    onChange={(e) => setRequestData({ ...requestData, floor: e.target.value })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><BuildingIcon color="action" /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('priority.priority')}</InputLabel>
                                    <Select
                                        value={requestData.priority}
                                        label={t('priority.priority')}
                                        onChange={(e) => setRequestData({ ...requestData, priority: e.target.value })}
                                        startAdornment={<InputAdornment position="start"><PriorityIcon fontSize="small" /></InputAdornment>}
                                    >
                                        <MenuItem value="Low">{t('priority.low')}</MenuItem>
                                        <MenuItem value="Medium">{t('priority.medium')}</MenuItem>
                                        <MenuItem value="High">{t('priority.high')}</MenuItem>
                                        <MenuItem value="Critical">{t('priority.critical')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('category.category')}</InputLabel>
                                    <Select
                                        value={requestData.category}
                                        label={t('category.category')}
                                        onChange={(e) => setRequestData({ ...requestData, category: e.target.value })}
                                        startAdornment={<InputAdornment position="start"><CategoryIcon fontSize="small" /></InputAdornment>}
                                    >
                                        {CATEGORIES.map(cat => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label={t('teamLeadDashboard.detailedDescription')}
                                    placeholder={t('teamLeadDashboard.provideContext')}
                                    value={requestData.description}
                                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><DescriptionIcon color="action" sx={{ mt: 1 }} /></InputAdornment>,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={isSubmitting || !requestData.title || !requestData.floor}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        background: 'linear-gradient(45deg, #1A237E 30%, #536DFE 90%)',
                                        boxShadow: '0 3px 5px 2px rgba(26, 35, 126, .3)'
                                    }}
                                >
                                    {isSubmitting ? t('teamLeadDashboard.submitting') : t('teamLeadDashboard.identifyDispatch')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>

            <Grid container spacing={4}>
                {/* Full Width Ticket List */}
                <Grid item xs={12}>
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            {t('teamLeadDashboard.teamTicketHistory')}
                        </Typography>
                        <Chip
                            icon={<SearchIcon />}
                            label={t('teamLeadDashboard.showingTickets', { count: activeTickets.length })}
                            variant="outlined"
                        />
                    </Box>

                    {activeTickets.length === 0 ? (
                        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#fafafa', borderStyle: 'dashed' }}>
                            <Box sx={{ mb: 2 }}>
                                <DoneIcon sx={{ fontSize: 60, color: '#bdbdbd' }} />
                            </Box>
                            <Typography variant="h6" color="text.secondary">
                                {t('teamLeadDashboard.allClear')}
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {activeTickets.map((ticket) => (
                                <Grid item xs={12} key={ticket._id}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 0,
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                                            border: '1px solid #e0e0e0'
                                        }}
                                    >
                                        <Box sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                                            {/* Status Indicator Stripe */}
                                            <Box sx={{
                                                width: 6,
                                                alignSelf: 'stretch',
                                                borderRadius: 1,
                                                bgcolor: ticket.status === 'Resolved' ? 'success.main' : getPriorityColor(ticket.priority) + '.main'
                                            }} />

                                            <Box sx={{ flexGrow: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {ticket.title}
                                                    </Typography>
                                                    <Chip
                                                        label={ticket.category}
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                                    />
                                                </Box>
                                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <BuildingIcon fontSize="inherit" /> {ticket.buildingWing}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <PersonIcon fontSize="inherit" /> {t('teamLeadDashboard.by')} {ticket.requester?.name || 'User'}
                                                    </Typography>
                                                    {ticket.technician && (
                                                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#1565C0', fontWeight: 600 }}>
                                                            <TechIcon fontSize="inherit" /> {t('teamLeadDashboard.tech')} {ticket.technician.name}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Stack>
                                            </Box>

                                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, width: { xs: '100%', sm: 'auto' } }}>
                                                {ticket.status === 'Resolved' && ticket.reviewStatus === 'Pending' ? (
                                                    <Chip
                                                        label={t('teamLeadDashboard.pendingReview')}
                                                        color="info"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 700, px: 1 }}
                                                    />
                                                ) : ticket.status === 'Resolved' ? (
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<FeedbackIcon />}
                                                        onClick={() => handleOpenFeedback(ticket)}
                                                        sx={{ borderRadius: 5, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
                                                    >
                                                        {t('teamLeadDashboard.reviewService')}
                                                    </Button>
                                                ) : (
                                                    <Stack alignItems="end">
                                                        <Chip
                                                            label={ticket.status}
                                                            color={ticket.status === 'In Progress' ? 'primary' : 'default'}
                                                            size="small"
                                                            variant={ticket.status === 'New' ? 'outlined' : 'filled'}
                                                        />
                                                        {ticket.status === 'New' && (
                                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                {t('teamLeadDashboard.waitingForAssign')}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                )}
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Grid>
            </Grid>

            {/* Feedback Dialog */}
            <Dialog
                open={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 4 }}>
                    {t('teamLeadDashboard.rateExperience')}
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            {t('teamLeadDashboard.howSatisfied')}
                        </Typography>
                        <Typography variant="h6" color="primary" gutterBottom>
                            {selectedTicket?.title}
                        </Typography>

                        <Box sx={{ my: 3 }}>
                            <Rating
                                value={rating}
                                onChange={(event, newValue) => setRating(newValue)}
                                size="large"
                                sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}
                            />
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label={t('teamLeadDashboard.additionalComments')}
                            placeholder={t('teamLeadDashboard.whatDidWell')}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            variant="filled"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button onClick={() => setFeedbackOpen(false)} size="large" sx={{ minWidth: 100, width: { xs: '100%', sm: 'auto' } }}>
                        {t('teamLeadDashboard.skip')}
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleSubmitFeedback}
                        size="large"
                        startIcon={<DoneIcon />}
                        sx={{ minWidth: 150, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                    >
                        {t('teamLeadDashboard.confirmResolved')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeamLeadDashboard;
