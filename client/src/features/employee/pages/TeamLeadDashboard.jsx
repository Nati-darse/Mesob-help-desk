import React, { useState, useMemo } from 'react';
import {
    Container, Box, Typography, Paper, Grid, TextField, Button, Chip,
    Stack, Card, CardContent, Divider, Avatar, Badge, Dialog, DialogTitle,
    DialogContent, DialogActions, Rating, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    History as HistoryIcon,
    FlashOn as InstantIcon,
    CheckCircle as DoneIcon,
    SentimentVerySatisfied as FeedbackIcon,
    Person as TechIcon,
    FmdGood as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { useTickets } from '../../tickets/hooks/useTickets';
import { getCompanyById } from '../../../utils/companies';
import axios from 'axios';

const TeamLeadDashboard = () => {
    const { user } = useAuth();
    const { data: tickets = [], refetch } = useTickets();
    const company = useMemo(() => getCompanyById(user?.companyId || 1), [user?.companyId]);

    // Form State
    const [requestData, setRequestData] = useState({
        title: '',
        description: '',
        floor: '',
        priority: 'Medium'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback Dialog State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const activeTickets = tickets.filter(t => t.status !== 'Closed');
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        if (!requestData.title || !requestData.floor) return;

        setIsSubmitting(true);
        try {
            await axios.post('/api/tickets', {
                title: requestData.title,
                description: requestData.description || 'Quick request from Team Leader',
                category: 'General',
                priority: requestData.priority,
                buildingWing: `Floor: ${requestData.floor}`,
                companyId: user.companyId
            });
            setRequestData({ title: '', description: '', floor: '', priority: 'Medium' });
            refetch();
        } catch (error) {
            console.error(error);
            alert('Failed to submit request');
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
            alert('Failed to submit feedback');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={4}>
                {/* Left Side: Raise Request & Quick Actions */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InstantIcon /> Raise New Request
                        </Typography>

                        <form onSubmit={handleQuickSubmit}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    label="What is the problem?"
                                    placeholder="e.g. Printer not working, Network down..."
                                    value={requestData.title}
                                    onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                                />
                                <TextField
                                    fullWidth
                                    label="Office / Company"
                                    value={company.name}
                                    disabled
                                    variant="filled"
                                />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Floor Number"
                                            required
                                            value={requestData.floor}
                                            onChange={(e) => setRequestData({ ...requestData, floor: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Priority"
                                            value={requestData.priority}
                                            onChange={(e) => setRequestData({ ...requestData, priority: e.target.value })}
                                            SelectProps={{ native: true }}
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </TextField>
                                    </Grid>
                                </Grid>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Additional Note (Optional)"
                                    value={requestData.description}
                                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    type="submit"
                                    disabled={isSubmitting || !requestData.title || !requestData.floor}
                                    sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Send Request'}
                                </Button>
                            </Stack>
                        </form>
                    </Paper>

                    <Card sx={{ borderRadius: 4, bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Active For Your Team</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{activeTickets.length}</Typography>
                                </Box>
                                <HistoryIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Side: Active Requests & Tracking */}
                <Grid item xs={12} lg={8}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>
                            Team Requests
                        </Typography>
                        <Chip label={`Office: ${company.initials}`} color="primary" sx={{ fontWeight: 700 }} />
                    </Box>

                    {activeTickets.length === 0 ? (
                        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
                            <Typography variant="h6" color="text.secondary">No active support requests for your team.</Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {activeTickets.map((ticket) => (
                                <Grid item xs={12} key={ticket._id}>
                                    <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'visible', position: 'relative' }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} md={6}>
                                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                        <Badge color={ticket.status === 'Resolved' ? 'success' : 'primary'} variant="dot">
                                                            <Avatar sx={{ bgcolor: 'action.hover' }}><LocationIcon color="primary" /></Avatar>
                                                        </Badge>
                                                        <Box>
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                                                            <Typography variant="body2" color="text.secondary">{ticket.buildingWing}</Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    {ticket.status === 'New' ? (
                                                        <Alert icon={false} severity="info" sx={{ py: 0, borderRadius: 2 }}>
                                                            Waiting for Admin to assign technician...
                                                        </Alert>
                                                    ) : (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'accent.main' }}><TechIcon sx={{ fontSize: 16 }} /></Avatar>
                                                            <Typography variant="body2" color="success.main" fontWeight="bold">
                                                                Technician Will Come Soon
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Grid>
                                                <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
                                                    {ticket.status === 'Resolved' ? (
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<FeedbackIcon />}
                                                            onClick={() => handleOpenFeedback(ticket)}
                                                            sx={{ borderRadius: 2, fontWeight: 700 }}
                                                        >
                                                            I Got Service
                                                        </Button>
                                                    ) : (
                                                        <Chip
                                                            label={ticket.status}
                                                            color={ticket.status === 'Assigned' ? 'info' : 'primary'}
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                    )}
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Grid>
            </Grid>

            {/* Feedback & Close Dialog */}
            <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Rate the Service</DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Rating
                            value={rating}
                            onChange={(event, newValue) => setRating(newValue)}
                            size="large"
                            sx={{ mb: 3 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Your Comments (Optional)"
                            placeholder="How was the experience?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Your feedback will be sent directly to the Admin.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setFeedbackOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={handleSubmitFeedback} startIcon={<DoneIcon />}>
                        Confirm Service Received
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeamLeadDashboard;
