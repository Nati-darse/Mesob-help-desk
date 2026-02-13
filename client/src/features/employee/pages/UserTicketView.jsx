import { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Chip, Stepper, Step, StepLabel, Divider, Button, Avatar, List, ListItem, ListItemText, TextField } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as BackIcon, Send as SendIcon, Star as StarIcon, StarOutline as StarOutlineIcon } from '@mui/icons-material';
import { Stack, IconButton, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import { formatCompanyLabel, getCompanyById } from '../../../utils/companies';
import { getStatusColor } from '../../../utils/ticketStatus';

const statusSteps = ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

const UserTicketView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const res = await axios.get(`/api/tickets/${id}`);
                setTicket(res.data);
            } catch (err) {
                console.error('Failed to fetch ticket');
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await axios.post(`/api/tickets/${id}/comment`, { text: comment });
            setComment('');
            const res = await axios.get(`/api/tickets/${id}`);
            setTicket(res.data);
        } catch (err) {
            console.error('Failed to add comment');
        }
    };

    const handleSubmitFeedback = async () => {
        if (!rating) return;
        setSubmitting(true);
        try {
            await axios.put(`/api/tickets/${id}/rate`, { rating, feedback });
            const res = await axios.get(`/api/tickets/${id}`);
            setTicket(res.data);
        } catch (err) {
            console.error('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Container sx={{ mt: 8 }}><Typography>Loading ticket details...</Typography></Container>;
    if (!ticket) return <Container sx={{ mt: 8 }}><Typography>Ticket not found.</Typography></Container>;

    const activeStep = statusSteps.indexOf(ticket.status);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Button
                startIcon={<BackIcon />}
                onClick={() => navigate('/portal')}
                sx={{ mb: 4 }}
            >
                Back to Dashboard
            </Button>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-start' }, gap: 2, mb: 3 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{ticket.title}</Typography>
                        <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {formatCompanyLabel(getCompanyById(ticket.companyId || user?.companyId || 1))}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            #{id.toUpperCase()} • Created on {new Date(ticket.createdAt).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Chip label={ticket.status} color={getStatusColor(ticket.status)} sx={{ fontWeight: 700 }} />
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Progress Timeline */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 4 }}>Tracking Timeline</Typography>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6, flexWrap: 'wrap' }}>
                    {statusSteps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', mb: 4 }}>
                    {ticket.description}
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{ticket.category}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{ticket.priority}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Location (Building/Floor)</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{ticket.buildingWing || 'Not specified'}</Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Feedback Section for Resolved Tickets */}
            {ticket.status === 'Resolved' && ticket.reviewStatus === 'None' && (
                <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'primary.light', borderRadius: 4, mb: 4, bgcolor: 'primary.50' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: 'primary.dark' }}>Resolution Feedback</Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                        The technician has marked this as resolved. Please provide your feedback to finalize the ticket.
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>How would you rate the resolution?</Typography>
                        <Stack direction="row" spacing={1}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <IconButton
                                    key={star}
                                    onClick={() => setRating(star)}
                                    color={rating >= star ? "primary" : "default"}
                                >
                                    {rating >= star ? <StarIcon /> : <StarOutlineIcon />}
                                </IconButton>
                            ))}
                        </Stack>
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Additional feedback for the administrator..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={!rating || submitting}
                        onClick={handleSubmitFeedback}
                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Feedback & Close Request'}
                    </Button>
                </Paper>
            )}

            {ticket.reviewStatus !== 'None' && (
                <Alert
                    severity={
                        ticket.reviewStatus === 'Approved' ? 'success' :
                            ticket.reviewStatus === 'Rejected' ? 'error' :
                                ticket.reviewStatus === 'Pending' ? 'warning' : 'info'
                    }
                    sx={{ mb: 4, borderRadius: 3 }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Review Status: {ticket.reviewStatus}
                    </Typography>
                    {ticket.reviewNotes && <Typography variant="body2">{ticket.reviewNotes}</Typography>}
                </Alert>
            )}

            {/* Conversation Section */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Conversation</Typography>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                <List sx={{ mb: 3 }}>
                    {ticket.comments?.map((c, i) => (
                        <ListItem key={i} alignItems="flex-start" sx={{ px: 0 }}>
                            <Avatar sx={{ mr: 2, bgcolor: c.user?.role === 'Technician' ? 'secondary.main' : 'primary.main' }}>
                                {c.user?.name?.charAt(0)}
                            </Avatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                            {c.user?.name} {c.user?.role === 'Technician' && <Chip label="Technician" size="small" sx={{ ml: 1, height: 20 }} />}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </Typography>
                                    </Box>
                                }
                                secondary={c.text}
                            />
                        </ListItem>
                    ))}
                </List>

                <Box component="form" onSubmit={handleAddComment} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add a message..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' }, mt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            endIcon={<SendIcon />}
                            disabled={!comment.trim()}
                            sx={{ px: 4, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                        >
                            Send Message
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default UserTicketView;
