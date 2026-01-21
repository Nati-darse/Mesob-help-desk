import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, Paper, TextField, 
    Button, Chip, Avatar, Divider, Select, MenuItem,
    FormControl, InputLabel, Switch, FormControlLabel, IconButton, Tooltip,
    Alert, Stepper, Step, StepLabel, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    Timeline, TimelineItem, TimelineSeparator,
    TimelineContent, TimelineDot
} from '@mui/lab';
import {
    CheckCircle as CheckIcon,
    Schedule as PendingIcon,
    Warning as WarningIcon,
    Build as BuildIcon,
    Save as SaveIcon,
    Send as SendIcon,
    Phone as PhoneIcon,
    Place as LocationIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    Assignment as TaskIcon,
    PlayArrow as StartIcon,
    Stop as FinishIcon,
    Feedback as FeedbackIcon,
    Note as NoteIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const ResolutionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [internalNotes, setInternalNotes] = useState('');
    const [customerUpdate, setCustomerUpdate] = useState('');
    const [resolutionData, setResolutionData] = useState({
        category: '',
        resolutionCode: '',
        timeSpent: '',
        partsUsed: '',
        nextSteps: '',
        rootCause: '',
        actionTaken: ''
    });
    const [timeline, setTimeline] = useState([]);
    const [technicianNote, setTechnicianNote] = useState('');
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [acceptStartDialogOpen, setAcceptStartDialogOpen] = useState(false);
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [initialNote, setInitialNote] = useState('');
    const [completionNote, setCompletionNote] = useState('');
    const [workflowStep, setWorkflowStep] = useState(0);
    const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

    const qc = useQueryClient();

    useEffect(() => {
        if (id) {
            fetchTicketDetails();
        }
    }, [id]);

    useEffect(() => {
        // Determine workflow step based on ticket status
        if (ticket) {
            if (!ticket.acceptedAt) setWorkflowStep(0);
            else if (!ticket.startedAt) setWorkflowStep(1);
            else if (!ticket.finishedAt) setWorkflowStep(2);
            else if (!ticket.feedbackRequestedAt) setWorkflowStep(3);
            else setWorkflowStep(4);
        }
    }, [ticket]);

    const fetchTicketDetails = async () => {
        try {
            const res = await axios.get(`/api/technician/${id}`);
            setTicket(res.data);
            setTimeline(res.data.timeline || []);
            setInternalNotes(res.data.internalNotes || '');
        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMutation = useMutation({
        mutationFn: async (updates) => {
            const res = await axios.put(`/api/technician/${id}`, updates);
            return res.data;
        },
        onMutate: async (updates) => {
            setTicket(prev => (prev ? { ...prev, ...updates } : prev));
            await qc.cancelQueries({ queryKey: ['tickets'] });
            const previous = qc.getQueryData(['tickets']);
            qc.setQueryData(['tickets'], (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map(t => (t._id === id ? { ...t, ...updates } : t));
            });
            return { previous };
        },
        onError: (err, updates, context) => {
            if (context && context.previous) qc.setQueryData(['tickets'], context.previous);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['tickets'] });
            fetchTicketDetails();
        }
    });

    const handleAcceptAndStartTicket = async () => {
        setAcceptStartDialogOpen(true);
    };

    const handleConfirmAcceptAndStart = async () => {
        try {
            await axios.put(`/api/technician/${id}/accept-and-start`, {
                initialNote: initialNote.trim() || undefined
            });
            setAlert({ show: true, message: 'Ticket accepted and work started successfully!', severity: 'success' });
            setAcceptStartDialogOpen(false);
            setInitialNote('');
            fetchTicketDetails();
        } catch (error) {
            console.error('Error accepting and starting ticket:', error);
            setAlert({ show: true, message: 'Error accepting and starting ticket', severity: 'error' });
        }
    };

    const handleFinishAndRequestFeedback = async () => {
        setFinishDialogOpen(true);
    };

    const handleConfirmFinishAndRequestFeedback = async () => {
        try {
            await axios.put(`/api/technician/${id}/finish-and-request-feedback`, {
                completionNote: completionNote.trim() || undefined
            });
            setAlert({ show: true, message: 'Work finished and feedback requested from team leader!', severity: 'success' });
            setFinishDialogOpen(false);
            setCompletionNote('');
            fetchTicketDetails();
        } catch (error) {
            console.error('Error finishing and requesting feedback:', error);
            setAlert({ show: true, message: 'Error finishing work and requesting feedback', severity: 'error' });
        }
    };

    const handleAcceptTicket = async () => {
        try {
            await axios.put(`/api/technician/${id}/accept`);
            setAlert({ show: true, message: 'Ticket accepted successfully!', severity: 'success' });
            fetchTicketDetails(); // Refresh ticket data
        } catch (error) {
            console.error('Error accepting ticket:', error);
            setAlert({ show: true, message: 'Error accepting ticket', severity: 'error' });
        }
    };

    const handleStartTicket = async () => {
        try {
            await axios.put(`/api/technician/${id}/start`);
            setAlert({ show: true, message: 'Work started on ticket!', severity: 'success' });
            fetchTicketDetails();
        } catch (error) {
            console.error('Error starting ticket:', error);
            setAlert({ show: true, message: 'Error starting ticket', severity: 'error' });
        }
    };

    const handleFinishTicket = async () => {
        try {
            await axios.put(`/api/technician/${id}/finish`);
            setAlert({ show: true, message: 'Work finished on ticket!', severity: 'success' });
            fetchTicketDetails();
        } catch (error) {
            console.error('Error finishing ticket:', error);
            setAlert({ show: true, message: 'Error finishing ticket', severity: 'error' });
        }
    };

    const handleRequestFeedback = async () => {
        try {
            await axios.put(`/api/technician/${id}/request-feedback`);
            setAlert({ show: true, message: 'Feedback requested from team leader!', severity: 'success' });
            fetchTicketDetails();
        } catch (error) {
            console.error('Error requesting feedback:', error);
            setAlert({ show: true, message: 'Error requesting feedback', severity: 'error' });
        }
    };

    const handleAddNote = async () => {
        if (!technicianNote.trim()) {
            setAlert({ show: true, message: 'Please enter a note', severity: 'warning' });
            return;
        }
        
        if (technicianNote.length > 500) {
            setAlert({ show: true, message: 'Note must be 500 characters or less', severity: 'warning' });
            return;
        }

        try {
            await axios.post(`/api/technician/${id}/notes`, { note: technicianNote });
            setAlert({ show: true, message: 'Note added successfully!', severity: 'success' });
            setTechnicianNote('');
            setNoteDialogOpen(false);
            fetchTicketDetails();
        } catch (error) {
            console.error('Error adding note:', error);
            setAlert({ show: true, message: 'Error adding note', severity: 'error' });
        }
    };

    const handleQuickAction = (action) => {
        const updates = {
            status: action === 'resolve' ? 'Resolved' : 
                    action === 'onsite' ? 'On-Site' : 
                    action === 'parts' ? 'Waiting for Parts' : 'Escalated',
            updatedAt: new Date()
        };
        updateMutation.mutate(updates);
    };

    const handleSaveInternalNotes = () => {
        axios.put(`/api/technician/${id}/internal-notes`, { internalNotes })
            .then(() => {
                // Add to timeline
                const newEntry = {
                    timestamp: new Date(),
                    type: 'internal',
                    user: user.name,
                    content: 'Internal notes updated'
                };
                setTimeline([...timeline, newEntry]);
            })
            .catch(error => console.error('Error saving notes:', error));
    };

    const handleSendCustomerUpdate = () => {
        if (!customerUpdate.trim()) return;
        
        axios.post(`/api/technician/${id}/updates`, { 
            message: customerUpdate,
            type: 'customer'
        })
            .then(() => {
                const newEntry = {
                    timestamp: new Date(),
                    type: 'customer',
                    user: user.name,
                    content: customerUpdate
                };
                setTimeline([...timeline, newEntry]);
                setCustomerUpdate('');
            })
            .catch(error => console.error('Error sending update:', error));
    };

    const handleResolve = () => {
        // Validate required fields
        if (!resolutionData.category || !resolutionData.resolutionCode || 
            !resolutionData.rootCause || !resolutionData.actionTaken) {
            alert('Please fill in all required fields: Category, Resolution Code, Root Cause, and Action Taken');
            return;
        }

        const resolveData = {
            ...resolutionData,
            resolvedAt: new Date(),
            resolvedBy: user._id
        };
        
        axios.put(`/api/technician/${id}/resolve`, resolveData)
            .then(() => {
                navigate('/tech');
            })
            .catch(error => console.error('Error resolving ticket:', error));
    };

    const getTimelineIcon = (type) => {
        switch (type) {
            case 'created': return <TaskIcon color="primary" />;
            case 'assigned': return <PersonIcon color="info" />;
            case 'accepted': return <CheckIcon color="success" />;
            case 'started': return <StartIcon color="primary" />;
            case 'finished': return <FinishIcon color="warning" />;
            case 'feedback_requested': return <FeedbackIcon color="secondary" />;
            case 'internal': return <BuildIcon color="secondary" />;
            case 'customer': return <PersonIcon color="success" />;
            case 'resolved': return <CheckIcon color="success" />;
            default: return <PendingIcon />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Typography>Loading ticket details...</Typography>
            </Box>
        );
    }

    if (!ticket) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Typography>Ticket not found</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Alert */}
            {alert.show && (
                <Alert 
                    severity={alert.severity} 
                    onClose={() => setAlert({ show: false, message: '', severity: 'info' })}
                    sx={{ mb: 2 }}
                >
                    {alert.message}
                </Alert>
            )}

            {/* Workflow Stepper */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Technician Workflow Progress
                </Typography>
                <Stepper activeStep={workflowStep} alternativeLabel>
                    <Step>
                        <StepLabel>Accept Ticket</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Start Work</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Finish Work</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Request Feedback</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Complete</StepLabel>
                    </Step>
                </Stepper>
            </Paper>

            <Grid container spacing={3}>
                {/* Left: Ticket Details */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, minHeight: 600 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h4" fontWeight="bold" gutterBottom>
                                    {ticket.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Chip 
                                        label={ticket.priority}
                                        color="primary"
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                    <Chip 
                                        label={ticket.companyDisplayInitials || ticket.company?.initials || 'Unknown'}
                                        variant="outlined"
                                        size="small"
                                    />
                                    <Chip 
                                        label={ticket.status}
                                        color={ticket.status === 'Resolved' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Created: {new Date(ticket.createdAt).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                    Client: {ticket.companyDisplayName || ticket.company?.name || 'Unknown Company'}
                                </Typography>
                            </Box>
                            
                            {/* Workflow Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                {/* Accept & Start Button */}
                                {!ticket.acceptedAt && ticket.status !== 'Resolved' && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckIcon />}
                                        onClick={handleAcceptAndStartTicket}
                                        sx={{ mb: 1 }}
                                    >
                                        Accept & Start Work
                                    </Button>
                                )}
                                
                                {/* Finish & Request Feedback Button */}
                                {ticket.startedAt && !ticket.feedbackRequestedAt && ticket.status !== 'Resolved' && (
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        startIcon={<FeedbackIcon />}
                                        onClick={handleFinishAndRequestFeedback}
                                        sx={{ mb: 1 }}
                                    >
                                        Finish & Request Feedback
                                    </Button>
                                )}
                                
                                {/* Add Note Button */}
                                <Button
                                    variant="outlined"
                                    startIcon={<NoteIcon />}
                                    onClick={() => setNoteDialogOpen(true)}
                                    sx={{ mb: 1 }}
                                >
                                    Add Note
                                </Button>
                                
                                {/* Quick Actions */}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Mark as On-Site">
                                        <IconButton 
                                            color="primary"
                                            onClick={() => handleQuickAction('onsite')}
                                        >
                                            <LocationIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Waiting for Parts">
                                        <IconButton 
                                            color="warning"
                                            onClick={() => handleQuickAction('parts')}
                                        >
                                            <BuildIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Escalate to Team Lead">
                                        <IconButton 
                                            color="error"
                                            onClick={() => handleQuickAction('escalate')}
                                        >
                                            <WarningIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Description */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Description
                            </Typography>
                            <Typography variant="body1">
                                {ticket.description}
                            </Typography>
                        </Box>

                        {/* Technician Notes Section */}
                        {ticket.technicianNotes && ticket.technicianNotes.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Technician Notes (For Future Reference)
                                </Typography>
                                {ticket.technicianNotes.map((noteItem, index) => (
                                    <Card key={index} sx={{ mb: 1, p: 2, backgroundColor: '#f8f9fa' }}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {noteItem.note}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Added on {new Date(noteItem.createdAt).toLocaleString()}
                                        </Typography>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {/* Timeline */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Ticket Timeline
                            </Typography>
                            <Timeline>
                                {timeline.map((entry, index) => (
                                    <TimelineItem key={index}>
                                        <TimelineSeparator>
                                            <TimelineDot color={entry.type === 'customer' ? 'success' : 'primary'}>
                                                {getTimelineIcon(entry.type)}
                                            </TimelineDot>
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="body2" fontWeight="bold">
                                                {entry.user}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2">
                                                {entry.content}
                                            </Typography>
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </Box>

                        {/* Resolution Form */}
                        {ticket.status !== 'Resolved' && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Resolution Workflow
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                value={resolutionData.category}
                                                onChange={(e) => setResolutionData({...resolutionData, category: e.target.value})}
                                            >
                                                <MenuItem value="Hardware">Hardware</MenuItem>
                                                <MenuItem value="Software">Software</MenuItem>
                                                <MenuItem value="Network">Network</MenuItem>
                                                <MenuItem value="User Error">User Error</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Resolution Code</InputLabel>
                                            <Select
                                                value={resolutionData.resolutionCode}
                                                onChange={(e) => setResolutionData({...resolutionData, resolutionCode: e.target.value})}
                                            >
                                                <MenuItem value="FIXED">Fixed</MenuItem>
                                                <MenuItem value="REPLACED">Replaced</MenuItem>
                                                <MenuItem value="WORKAROUND">Workaround</MenuItem>
                                                <MenuItem value="ESCALATED">Escalated</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Time Spent (hours)"
                                            type="number"
                                            size="small"
                                            value={resolutionData.timeSpent}
                                            onChange={(e) => setResolutionData({...resolutionData, timeSpent: e.target.value})}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Parts Used"
                                            size="small"
                                            value={resolutionData.partsUsed}
                                            onChange={(e) => setResolutionData({...resolutionData, partsUsed: e.target.value})}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Root Cause *"
                                            size="small"
                                            required
                                            value={resolutionData.rootCause}
                                            onChange={(e) => setResolutionData({...resolutionData, rootCause: e.target.value})}
                                            helperText="Describe the underlying cause of the issue"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Action Taken *"
                                            size="small"
                                            required
                                            value={resolutionData.actionTaken}
                                            onChange={(e) => setResolutionData({...resolutionData, actionTaken: e.target.value})}
                                            helperText="Describe the steps taken to resolve the issue"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Next Steps"
                                            size="small"
                                            value={resolutionData.nextSteps}
                                            onChange={(e) => setResolutionData({...resolutionData, nextSteps: e.target.value})}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button 
                                            variant="contained" 
                                            color="success"
                                            startIcon={<CheckIcon />}
                                            onClick={handleResolve}
                                            disabled={!resolutionData.category || !resolutionData.resolutionCode || 
                                                     !resolutionData.rootCause || !resolutionData.actionTaken}
                                        >
                                            Mark as Resolved
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Right: Communication Panel */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={2}>
                        {/* Internal Notes */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 2, background: '#f5f5f5' }}>
                                <Typography variant="h6" gutterBottom>
                                    Internal Notes (IT Only)
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    size="small"
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    helperText="Visible only to IT staff"
                                />
                                <Button 
                                    variant="outlined" 
                                    startIcon={<SaveIcon />}
                                    onClick={handleSaveInternalNotes}
                                    sx={{ mt: 1 }}
                                >
                                    Save Notes
                                </Button>
                            </Card>
                        </Grid>

                        {/* Customer Updates */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Customer Update
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    size="small"
                                    value={customerUpdate}
                                    onChange={(e) => setCustomerUpdate(e.target.value)}
                                    helperText="Visible to end-user"
                                />
                                <Button 
                                    variant="contained" 
                                    startIcon={<SendIcon />}
                                    onClick={handleSendCustomerUpdate}
                                    sx={{ mt: 1 }}
                                    disabled={!customerUpdate.trim()}
                                >
                                    Send Update
                                </Button>
                            </Card>
                        </Grid>

                        {/* Contact Info */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Contact Information
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        <strong>Name:</strong> {ticket.requester?.name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" gutterBottom>
                                        <strong>Email:</strong> {ticket.requester?.email || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" gutterBottom>
                                        <strong>Phone:</strong> {ticket.requester?.phone || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Location:</strong> {ticket.location || 'N/A'}
                                    </Typography>
                                </Box>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<PhoneIcon />}
                                    fullWidth
                                >
                                    Call User
                                </Button>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            {/* Add Note Dialog */}
            <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Technician Note</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Add a note for future reference when encountering similar issues. Maximum 500 characters.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={technicianNote}
                        onChange={(e) => setTechnicianNote(e.target.value)}
                        placeholder="Describe the issue, solution, or important details for future reference..."
                        helperText={`${technicianNote.length}/500 characters`}
                        error={technicianNote.length > 500}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleAddNote} 
                        variant="contained"
                        disabled={!technicianNote.trim() || technicianNote.length > 500}
                    >
                        Add Note
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Accept & Start Dialog */}
            <Dialog open={acceptStartDialogOpen} onClose={() => setAcceptStartDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckIcon color="success" />
                        Accept & Start Work
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You're about to accept this ticket and start working on it immediately. 
                        You can optionally add an initial note about your approach or findings.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={initialNote}
                        onChange={(e) => setInitialNote(e.target.value)}
                        placeholder="Optional: Add initial note about your approach or findings (max 500 characters)..."
                        inputProps={{ maxLength: 500 }}
                        helperText={`${initialNote.length}/500 characters`}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAcceptStartDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleConfirmAcceptAndStart}
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                    >
                        Accept & Start Work
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Finish & Request Feedback Dialog */}
            <Dialog open={finishDialogOpen} onClose={() => setFinishDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FeedbackIcon color="warning" />
                        Finish Work & Request Feedback
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        You're about to mark this work as finished and automatically request feedback 
                        from the team leader who created this ticket. You can add a completion note 
                        describing what was done.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={completionNote}
                        onChange={(e) => setCompletionNote(e.target.value)}
                        placeholder="Optional: Add completion note describing what was done (max 500 characters)..."
                        inputProps={{ maxLength: 500 }}
                        helperText={`${completionNote.length}/500 characters`}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFinishDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleConfirmFinishAndRequestFeedback}
                        variant="contained"
                        color="warning"
                        startIcon={<FeedbackIcon />}
                    >
                        Finish & Request Feedback
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ResolutionPage;
