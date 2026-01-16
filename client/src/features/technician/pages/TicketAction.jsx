import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Stepper, Step, StepLabel, Button, TextField, Divider, Stack, Grid, Chip, Alert, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as BackIcon, Save as SaveIcon, CheckCircle as CheckIcon, History as HistoryIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import { getCompanyById } from '../../../utils/companies';

const techStatuses = ['Diagnosing', 'Parts Pending', 'Testing', 'Resolved'];

const TicketAction = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const res = await axios.get(`/api/tickets/${id}`);
                setTicket(res.data);
            } catch (err) {
                setError('Failed to load ticket details.');
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        setSubmitting(true);
        try {
            await axios.put(`/api/tickets/${id}`, { status: newStatus });
            setTicket({ ...ticket, status: newStatus });
        } catch (err) {
            setError('Failed to update status.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddWorkLog = async () => {
        if (!note.trim()) return;
        setSubmitting(true);
        try {
            const res = await axios.post(`/api/tickets/${id}/worklog`, { note });
            setTicket(res.data);
            setNote('');
        } catch (err) {
            setError('Failed to save work log.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAssignToMe = async () => {
        setSubmitting(true);
        try {
            await axios.put(`/api/tickets/${id}/assign`, { technicianId: user._id });
            const res = await axios.get(`/api/tickets/${id}`);
            setTicket(res.data);
        } catch (err) {
            setError('Failed to assign ticket.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!ticket) return <Container sx={{ mt: 4 }}><Typography>Ticket not found.</Typography></Container>;

    const activeStep = techStatuses.indexOf(ticket.status);
    const isUnassigned = !ticket.technician;
    const isMyTicket = ticket.technician?._id === user?._id;
    const company = getCompanyById(ticket.companyId || 1);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/tech')} sx={{ mb: 4 }}>
                Back to Dashboard
            </Button>

            <Grid container spacing={4}>
                {/* Left Side: Ticket Info */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Box>
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                                    {company.name}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{ticket.title}</Typography>
                            </Box>
                            <Chip label={ticket.priority} color={ticket.priority === 'Critical' ? 'error' : 'warning'} sx={{ fontWeight: 700 }} />
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {isUnassigned ? (
                            <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 4, textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Ticket is Unassigned</Typography>
                                <Button variant="contained" size="large" onClick={handleAssignToMe} disabled={submitting}>
                                    Take Ticket
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 4 }}>Resolution Progress</Typography>
                                <Stepper activeStep={activeStep === -1 ? 0 : activeStep} alternativeLabel sx={{ mb: 6 }}>
                                    {techStatuses.map((label, index) => (
                                        <Step key={label}>
                                            <StepLabel
                                                onClick={() => isMyTicket && index > activeStep && handleStatusUpdate(label)}
                                                sx={{ cursor: isMyTicket ? 'pointer' : 'default' }}
                                            >
                                                {label}
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>

                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                                    {activeStep < techStatuses.length - 1 && isMyTicket && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleStatusUpdate(techStatuses[activeStep + 1])}
                                            disabled={submitting}
                                            startIcon={<CheckIcon />}
                                        >
                                            Next Stage: {techStatuses[activeStep + 1]}
                                        </Button>
                                    )}
                                </Box>
                            </>
                        )}

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Issue Description</Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap', mb: 4 }}>
                            {ticket.description}
                        </Typography>

                        <Stack direction="row" spacing={3}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Location</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.buildingWing || 'N/A'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Category</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.category}</Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Work Log Section */}
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Work Log</Typography>
                    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Add technical notes, part orders, or diagnostic details..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={!isMyTicket}
                                sx={{ bgcolor: 'action.hover', borderRadius: 2 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleAddWorkLog}
                                    disabled={!note.trim() || submitting || !isMyTicket}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Save Note
                                </Button>
                            </Box>
                        </Box>

                        <Stack spacing={2}>
                            {ticket.workLog?.slice().reverse().map((log, i) => (
                                <Box key={i} sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Tech Note</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleString()}</Typography>
                                    </Box>
                                    <Typography variant="body2">{log.note}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Side: Requester & Feedback */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Requester</Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, color: 'white', display: 'flex' }}>
                                <HistoryIcon />
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.requester?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{ticket.requester?.email}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TicketAction;
