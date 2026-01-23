import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Button, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Chip,
    Avatar, IconButton, Tooltip, Paper, CircularProgress, Alert, Tabs, Tab, Grid, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stepper, Step, StepLabel
} from '@mui/material';
import {
    Assignment as TaskIcon,
    CheckCircle as AcceptIcon,
    AccessTime as TimeIcon,
    Place as LocationIcon,
    Visibility as ViewIcon,
    Work as WorkIcon,
    Schedule as PendingIcon,
    Build as BuildIcon,
    PlayArrow as StartIcon,
    Stop as FinishIcon,
    Feedback as FeedbackIcon,
    Note as NoteIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLES } from '../../../constants/roles';
import axios from 'axios';

const TechDashboard = () => {
    const { user } = useAuth();
    const [dutyStatus, setDutyStatus] = useState('Online');
    const [performance, setPerformance] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [newlyAssignedTickets, setNewlyAssignedTickets] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
    const [workflowStep, setWorkflowStep] = useState(0);
    const [noteText, setNoteText] = useState('');
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [acceptStartDialogOpen, setAcceptStartDialogOpen] = useState(false);
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [initialNote, setInitialNote] = useState('');
    const [completionNote, setCompletionNote] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            console.log('=== TECH DASHBOARD INITIALIZATION ===');
            console.log('User data:', user);
            console.log('User duty status:', user.dutyStatus);
            console.log('User role:', user.role);
            console.log('Setting initial duty status to:', user.dutyStatus || 'Online');
            
            setDutyStatus(user.dutyStatus || 'Online');
            fetchPerformanceMetrics();
            fetchTickets();
        }
    }, [user]);

    const fetchPerformanceMetrics = async () => {
        try {
            const res = await axios.get('/api/technician/performance');
            setPerformance(res.data);
        } catch (error) {
            console.error('Error fetching performance:', error);
        }
    };

    const fetchTickets = async () => {
        try {
            const res = await axios.get('/api/technician/assigned');
            const allTickets = res.data;
            
            // Filter for newly assigned tickets (assigned but not yet accepted)
            const newlyAssigned = allTickets.filter(ticket => 
                (ticket.status === 'Assigned' || ticket.status === 'New') && 
                !ticket.acceptedAt
            );
            
            setNewlyAssignedTickets(newlyAssigned);
            setAllTickets(allTickets);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setError('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptAndStartTicket = async (ticketId) => {
        setSelectedTicket(allTickets.find(t => t._id === ticketId));
        setAcceptStartDialogOpen(true);
    };

    const handleConfirmAcceptAndStart = async () => {
        try {
            const response = await axios.put(`/api/technician/${selectedTicket._id}/accept-and-start`, {
                initialNote: initialNote.trim() || undefined
            });
            
            setAcceptStartDialogOpen(false);
            setInitialNote('');
            fetchTickets();
            alert('Ticket accepted and work started successfully!');
        } catch (error) {
            console.error('Error accepting and starting ticket:', error);
            alert(`Failed to accept and start ticket: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleFinishAndRequestFeedback = async (ticket) => {
        setSelectedTicket(ticket);
        setFinishDialogOpen(true);
    };

    const handleConfirmFinishAndRequestFeedback = async () => {
        try {
            await axios.put(`/api/technician/${selectedTicket._id}/finish-and-request-feedback`, {
                completionNote: completionNote.trim() || undefined
            });
            setFinishDialogOpen(false);
            setCompletionNote('');
            fetchTickets();
            alert('Work finished and feedback requested from team leader!');
        } catch (error) {
            console.error('Error finishing and requesting feedback:', error);
            alert('Failed to finish work and request feedback');
        }
    };

    const handleAcceptTicket = async (ticketId) => {
        try {
            await axios.put(`/api/technician/${ticketId}/accept`);
            // Refresh tickets after accepting
            fetchTickets();
        } catch (error) {
            console.error('Error accepting ticket:', error);
        }
    };

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setTicketDialogOpen(true);
        
        // Determine workflow step based on ticket status
        if (!ticket.acceptedAt) {
            setWorkflowStep(0); // Not accepted
        } else if (!ticket.startedAt) {
            setWorkflowStep(1); // Accepted, not started
        } else if (!ticket.finishedAt) {
            setWorkflowStep(2); // Started, not finished
        } else if (ticket.feedbackRequestedAt) {
            setWorkflowStep(4); // Complete (feedback requested)
        } else {
            setWorkflowStep(3); // Finished, but no feedback requested (legacy state)
        }
    };

    const handleStartTicket = async () => {
        try {
            await axios.put(`/api/technician/${selectedTicket._id}/start`);
            fetchTickets();
            // Update selected ticket
            setSelectedTicket({...selectedTicket, startedAt: new Date(), status: 'In Progress'});
            setWorkflowStep(2);
        } catch (error) {
            console.error('Error starting ticket:', error);
        }
    };

    const handleFinishTicket = async () => {
        try {
            await axios.put(`/api/technician/${selectedTicket._id}/finish`);
            fetchTickets();
            // Update selected ticket
            setSelectedTicket({...selectedTicket, finishedAt: new Date(), status: 'Completed'});
            setWorkflowStep(3);
        } catch (error) {
            console.error('Error finishing ticket:', error);
        }
    };

    const handleRequestFeedback = async () => {
        try {
            await axios.put(`/api/technician/${selectedTicket._id}/request-feedback`);
            fetchTickets();
            // Update selected ticket
            setSelectedTicket({...selectedTicket, feedbackRequestedAt: new Date(), status: 'Pending Feedback'});
            setWorkflowStep(4);
        } catch (error) {
            console.error('Error requesting feedback:', error);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        
        try {
            await axios.post(`/api/technician/${selectedTicket._id}/notes`, { note: noteText });
            setNoteText('');
            setNoteDialogOpen(false);
            // Refresh ticket data if needed
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleDutyStatusChange = async (newStatus) => {
        setStatusUpdating(true);
        console.log('=== DUTY STATUS UPDATE DEBUG ===');
        console.log('Current user:', user);
        console.log('Current dutyStatus state:', dutyStatus);
        console.log('New status to set:', newStatus);
        console.log('User token exists:', !!user?.token);
        console.log('Authorization header:', axios.defaults.headers.common['Authorization']);
        
        try {
            console.log('Making API request to update duty status...');
            const response = await axios.put('/api/technician/duty-status', { dutyStatus: newStatus });
            console.log('API response:', response.data);
            
            // Update local state
            setDutyStatus(newStatus);
            console.log('Local state updated to:', newStatus);
            
            // Also update the user context if possible
            // This ensures the status is synced across the app
            if (user) {
                const updatedUser = { ...user, dutyStatus: newStatus };
                localStorage.setItem('mesob_user', JSON.stringify(updatedUser));
                console.log('LocalStorage updated with new user data');
            }
            
            console.log('Duty status successfully updated to:', newStatus);
            alert('Duty status updated successfully!'); // Temporary success feedback
        } catch (error) {
            console.error('=== DUTY STATUS UPDATE ERROR ===');
            console.error('Error updating duty status:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error headers:', error.response?.headers);
            
            // The global axios interceptor will handle 401 errors (token expiration)
            // So we only need to handle other types of errors here
            if (error.response?.status !== 401) {
                alert(`Failed to update duty status: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setStatusUpdating(false);
            console.log('=== DUTY STATUS UPDATE COMPLETE ===');
        }
    };

    const getPriorityColor = (priority, createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const hoursElapsed = (now - created) / (1000 * 60 * 60);

        if (priority === 'Critical') {
            return hoursElapsed > 1 ? '#0a192f' : '#153b8a';
        } else if (priority === 'High') {
            return hoursElapsed > 4 ? '#1e4fb1' : '#0061f2';
        }
        return '#42a5f5';
    };

    const getSLABadge = (priority, createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const hoursElapsed = (now - created) / (1000 * 60 * 60);

        if (priority === 'Critical') {
            return hoursElapsed <= 1 ? 'SLA OK' : 'SLA BREACH';
        } else if (priority === 'High') {
            return hoursElapsed <= 4 ? 'SLA OK' : 'SLA BREACH';
        }
        return 'Normal';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Online': return 'success';
            case 'On-Site': return 'primary';
            case 'Break': return 'warning';
            case 'Offline': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Online': return 'Online (Available)';
            case 'On-Site': return 'On-Site (Busy)';
            case 'Break': return 'Break (Unavailable)';
            case 'Offline': return 'Offline';
            default: return status;
        }
    };

    const TicketCard = ({ ticket, showAcceptButton = false }) => {
        const priorityColor = getPriorityColor(ticket.priority, ticket.createdAt);
        const slaStatus = getSLABadge(ticket.priority, ticket.createdAt);
        const isSLABreach = slaStatus === 'SLA BREACH';

        return (
            <Card
                sx={{
                    mb: 2,
                    border: isSLABreach ? `2px solid ${priorityColor}` : '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                    }
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Avatar sx={{ bgcolor: priorityColor, color: 'white', mr: 2, width: 40, height: 40 }}>
                                <TaskIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {ticket.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {ticket.companyDisplayName || ticket.company?.name || 'Unknown Company'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {ticket.companyDisplayInitials || ticket.company?.initials || 'UNK'} • 
                                    Ticket #{ticket._id?.slice(-6)} • 
                                    {ticket.location || 'No location'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                            <Chip
                                label={slaStatus}
                                color={isSLABreach ? 'error' : 'success'}
                                size="small"
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                {new Date(ticket.createdAt).toLocaleString()}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                label={ticket.priority}
                                size="small"
                                sx={{
                                    bgcolor: priorityColor,
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Chip
                                label={ticket.status}
                                size="small"
                                variant="outlined"
                                color="primary"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {showAcceptButton && (
                                <Tooltip title="Accept & Start Work">
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        startIcon={<AcceptIcon />}
                                        onClick={() => handleAcceptAndStartTicket(ticket._id)}
                                    >
                                        Accept & Start
                                    </Button>
                                </Tooltip>
                            )}
                            {ticket.status === 'In Progress' && (
                                <Tooltip title="Finish & Request Feedback">
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        size="small"
                                        startIcon={<FeedbackIcon />}
                                        onClick={() => handleFinishAndRequestFeedback(ticket)}
                                    >
                                        Finish Work
                                    </Button>
                                </Tooltip>
                            )}
                            <Tooltip title="View Details">
                                <IconButton
                                    onClick={() => handleViewTicket(ticket)}
                                    color="primary"
                                >
                                    <ViewIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    MESOB Technician Workspace
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome, {user?.name || 'Technician'}. MESOB IT Support Team for all client companies.
                </Typography>
            </Box>

            {/* Duty Status Toggle - Matching Screenshot */}
            <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #0a192f 0%, #1a237e 100%)', color: 'white' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Current Duty Status
                            </Typography>
                            <Chip 
                                label={dutyStatus}
                                color={getStatusColor(dutyStatus)}
                                size="large"
                                sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Change Status:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <Select
                                    value={dutyStatus}
                                    onChange={(e) => handleDutyStatusChange(e.target.value)}
                                    disabled={statusUpdating}
                                    sx={{ 
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                                        '& .MuiSvgIcon-root': { color: 'white' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                                        '&.Mui-disabled': { 
                                            color: 'rgba(255,255,255,0.6)',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
                                        }
                                    }}
                                    displayEmpty
                                >
                                    <MenuItem value="Online">Online (Available)</MenuItem>
                                    <MenuItem value="On-Site">On-Site (Busy)</MenuItem>
                                    <MenuItem value="Break">Break (Unavailable)</MenuItem>
                                    <MenuItem value="Offline">Offline</MenuItem>
                                </Select>
                                {statusUpdating && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                            Updating status...
                                        </Typography>
                                    </Box>
                                )}
                            </FormControl>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Performance Metrics - Matching Screenshot */}
            {performance && (
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            My Efficiency Dashboard
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: 4,
                            mt: 2
                        }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="primary" fontWeight="bold">
                                    {performance.avgResponseTime}h
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight="500">
                                    Avg. Response Time
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ({performance.responseTimeCount} tickets)
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="success.main" fontWeight="bold">
                                    {performance.avgResolutionTime}h
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight="500">
                                    Avg. Resolution Time
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ({performance.resolutionTimeCount} tickets)
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="warning.main" fontWeight="bold">
                                    {performance.todayResolved}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight="500">
                                    Resolved Today
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" color="info.main" fontWeight="bold">
                                    {performance.totalResolved}/{performance.totalAssigned}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" fontWeight="500">
                                    Total Resolved
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Tickets Section with Tabs */}
            <Card>
                <CardContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                            <Tab 
                                label={`Newly Assigned (${newlyAssignedTickets.length})`} 
                                icon={<PendingIcon />}
                                iconPosition="start"
                            />
                            <Tab 
                                label={`All My Tickets (${allTickets.length})`} 
                                icon={<WorkIcon />}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    {/* Newly Assigned Tickets Tab */}
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Tickets Waiting for Acceptance
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                These tickets have been assigned to you and need to be accepted to start working.
                            </Typography>
                             
                            {newlyAssignedTickets.length === 0 ? (
                                <Paper sx={{ p: 4, textAlign: 'center' }}>
                                    <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No Newly Assigned Tickets
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        All your assigned tickets have been accepted. Great job!
                                    </Typography>
                                </Paper>
                            ) : (
                                <Box>
                                    {newlyAssignedTickets.map(ticket => (
                                        <TicketCard key={ticket._id} ticket={ticket} showAcceptButton={true} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* All Tickets Tab */}
                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                All My Assigned Tickets
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Complete overview of all tickets assigned to you across all companies.
                            </Typography>
                             
                            {allTickets.length === 0 ? (
                                <Paper sx={{ p: 4, textAlign: 'center' }}>
                                    <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No Tickets Assigned
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        You don't have any tickets assigned at the moment.
                                    </Typography>
                                </Paper>
                            ) : (
                                <Box>
                                    {allTickets.map(ticket => (
                                        <TicketCard key={ticket._id} ticket={ticket} showAcceptButton={false} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 4 }}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                        fetchTickets();
                        fetchPerformanceMetrics();
                    }}
                    size="large"
                    sx={{ px: 4, py: 1.5 }}
                >
                    Refresh Dashboard
                </Button>
            </Box>

            {/* Ticket Details Dialog */}
            <Dialog 
                open={ticketDialogOpen} 
                onClose={() => setTicketDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedTicket && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h6">{selectedTicket.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Ticket #{selectedTicket._id?.slice(-6)} • {selectedTicket.companyDisplayName}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setTicketDialogOpen(false)}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        
                        <DialogContent>
                            {/* Workflow Stepper */}
                            <Stepper activeStep={workflowStep} sx={{ mb: 4 }}>
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

                            {/* Ticket Details */}
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Ticket Details</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Description:</Typography>
                                            <Typography variant="body1" sx={{ mb: 2 }}>{selectedTicket.description}</Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Priority:</Typography>
                                            <Chip 
                                                label={selectedTicket.priority} 
                                                color={selectedTicket.priority === 'Critical' ? 'error' : 'primary'}
                                                sx={{ mb: 2 }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                                            <Typography variant="body1">{selectedTicket.location || 'Not specified'}</Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary">Status:</Typography>
                                            <Chip label={selectedTicket.status} variant="outlined" />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Workflow Actions */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                                {workflowStep === 1 && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<StartIcon />}
                                        onClick={handleStartTicket}
                                    >
                                        Start Work
                                    </Button>
                                )}
                                
                                {workflowStep === 2 && (
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        startIcon={<FeedbackIcon />}
                                        onClick={() => handleFinishAndRequestFeedback(selectedTicket)}
                                    >
                                        Finish & Request Feedback
                                    </Button>
                                )}
                                
                                {workflowStep === 3 && (
                                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                        ✓ Work completed and feedback requested from team leader
                                    </Typography>
                                )}

                                <Button
                                    variant="outlined"
                                    startIcon={<NoteIcon />}
                                    onClick={() => setNoteDialogOpen(true)}
                                >
                                    Add Note
                                </Button>
                            </Box>

                            {/* Timeline */}
                            {selectedTicket.timeline && (
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Timeline</Typography>
                                        {selectedTicket.timeline.map((event, index) => (
                                            <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < selectedTicket.timeline.length - 1 ? '1px solid #eee' : 'none' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </Typography>
                                                <Typography variant="body1">
                                                    <strong>{event.user}:</strong> {event.content}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </DialogContent>
                        
                        <DialogActions>
                            <Button onClick={() => setTicketDialogOpen(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Note Dialog */}
            <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Technician Note</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Enter your note (max 500 characters)..."
                        inputProps={{ maxLength: 500 }}
                        helperText={`${noteText.length}/500 characters`}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleAddNote}
                        variant="contained"
                        disabled={!noteText.trim()}
                    >
                        Add Note
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Accept & Start Dialog */}
            <Dialog open={acceptStartDialogOpen} onClose={() => setAcceptStartDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AcceptIcon color="success" />
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
                        startIcon={<AcceptIcon />}
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

export default TechDashboard;