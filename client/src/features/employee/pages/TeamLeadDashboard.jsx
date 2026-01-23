import React, { useState, useMemo, useEffect } from 'react';
import {
    Container, Box, Typography, Paper, Grid, TextField, Button, Chip,
    Stack, Card, CardContent, Divider, Avatar, Badge, Dialog, DialogTitle,
    DialogContent, DialogActions, Rating, Alert, Select, MenuItem, FormControl,
    InputLabel, CircularProgress, LinearProgress, IconButton, Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    History as HistoryIcon,
    FlashOn as InstantIcon,
    CheckCircle as DoneIcon,
    SentimentVerySatisfied as FeedbackIcon,
    Person as TechIcon,
    FmdGood as LocationIcon,
    Engineering as TechnicianIcon,
    Assignment as AssignmentIcon,
    Star as StarIcon,
    Close as CloseIcon
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
        priority: 'Medium',
        requiresTechnician: true,
        category: 'Technical Support'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback Dialog State
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    // Technician Assignment Status
    const [assignmentStatus, setAssignmentStatus] = useState({});
    const [technicians, setTechnicians] = useState([]);

    // Filter tickets by status
    const pendingTickets = tickets.filter(t => t.status === 'New' || t.status === 'Pending');
    const assignedTickets = tickets.filter(t => t.status === 'Assigned');
    const inProgressTickets = tickets.filter(t => t.status === 'In Progress');
    const completedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Completed');
    const activeTickets = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved');

    useEffect(() => {
        // Load technicians for display
        const loadTechnicians = async () => {
            try {
                const response = await axios.get('/api/users/technicians');
                setTechnicians(response.data);
            } catch (error) {
                console.error('Failed to load technicians:', error);
            }
        };
        loadTechnicians();
    }, []);

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        if (!requestData.title || !requestData.floor) return;

        setIsSubmitting(true);
        try {
            await axios.post('/api/tickets', {
                title: requestData.title,
                description: requestData.description || 'Technician request from Team Leader',
                category: requestData.category,
                priority: requestData.priority,
                buildingWing: `Floor: ${requestData.floor}`,
                companyId: user.companyId,
                requestedBy: user.name,
                requiresTechnician: requestData.requiresTechnician,
                status: 'Pending' // Mark as pending for admin assignment
            });
            setRequestData({ 
                title: '', 
                description: '', 
                floor: '', 
                priority: 'Medium',
                requiresTechnician: true,
                category: 'Technical Support'
            });
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
        setIsSubmittingFeedback(true);
        try {
            await axios.put(`/api/tickets/${selectedTicket._id}/rate`, {
                rating,
                feedback: comment,
                feedbackBy: user.name,
                feedbackDate: new Date()
            });
            
            // Also close the ticket after feedback
            await axios.put(`/api/tickets/${selectedTicket._id}`, {
                status: 'Closed'
            });
            
            setFeedbackOpen(false);
            setRating(5);
            setComment('');
            refetch();
        } catch (error) {
            console.error(error);
            alert('Failed to submit feedback');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const getTicketStatusColor = (status) => {
        switch (status) {
            case 'New': return 'info';
            case 'Pending': return 'warning';
            case 'Assigned': return 'primary';
            case 'In Progress': return 'secondary';
            case 'Resolved': return 'success';
            case 'Completed': return 'success';
            default: return 'default';
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
        <Container maxWidth="xl" sx={{ 
            mt: 4, 
            mb: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: 'calc(100vh - 120px)'
        }}>
            <Box sx={{ width: '100%', maxWidth: '1400px' }}>
                {/* Header Section */}
                <Box sx={{ 
                    mb: 4, 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <Typography variant="h3" sx={{ 
                        fontWeight: 900, 
                        color: 'primary.main',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2
                    }}>
                        <TechnicianIcon sx={{ fontSize: 40 }} />
                        Team Leader Dashboard
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        Manage technician requests and track service progress for your team
                    </Typography>
                    <Chip 
                        label={`${company.name} - ${company.initials}`} 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 700, px: 2 }}
                    />
                </Box>

                <Grid container spacing={4} justifyContent="center">
                    {/* Left Side: Raise Request & Quick Actions */}
                    <Grid item xs={12} lg={4} xl={3}>
                        <Paper sx={{ 
                            p: 4, 
                            borderRadius: 4, 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            mb: 4,
                            boxShadow: 3
                        }}>
                            <Typography variant="h5" sx={{ 
                                fontWeight: 800, 
                                color: 'primary.main', 
                                mb: 3, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                textAlign: 'center',
                                justifyContent: 'center'
                            }}>
                                <TechnicianIcon /> Request Technician Support
                            </Typography>

                            <form onSubmit={handleQuickSubmit}>
                                <Stack spacing={2.5}>
                                    <TextField
                                        fullWidth
                                        label="What support do you need?"
                                        placeholder="e.g. Computer not working, Network issues, Software installation..."
                                        value={requestData.title}
                                        onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                                        required
                                    />
                                    
                                    <FormControl fullWidth>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            value={requestData.category}
                                            label="Category"
                                            onChange={(e) => setRequestData({ ...requestData, category: e.target.value })}
                                        >
                                            <MenuItem value="Technical Support">Technical Support</MenuItem>
                                            <MenuItem value="Hardware Issue">Hardware Issue</MenuItem>
                                            <MenuItem value="Software Issue">Software Issue</MenuItem>
                                            <MenuItem value="Network Issue">Network Issue</MenuItem>
                                            <MenuItem value="Printer Issue">Printer Issue</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </Select>
                                    </FormControl>

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
                                            >
                                                <MenuItem value="Low">Low</MenuItem>
                                                <MenuItem value="Medium">Medium</MenuItem>
                                                <MenuItem value="High">High</MenuItem>
                                                <MenuItem value="Critical">Critical</MenuItem>
                                            </TextField>
                                        </Grid>
                                    </Grid>
                                    
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Describe the issue in detail"
                                        placeholder="Please provide as much detail as possible about the issue..."
                                        value={requestData.description}
                                        onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                                    />

                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        <Typography variant="body2">
                                            📋 Your request will be sent to the Super Admin for technician assignment. 
                                            You'll be notified when a technician is assigned.
                                        </Typography>
                                    </Alert>
                                    
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        type="submit"
                                        disabled={isSubmitting || !requestData.title || !requestData.floor}
                                        sx={{ 
                                            py: 1.5, 
                                            borderRadius: 3, 
                                            fontWeight: 700,
                                            boxShadow: 2
                                        }}
                                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <AssignmentIcon />}
                                    >
                                        {isSubmitting ? 'Submitting Request...' : 'Request Technician'}
                                    </Button>
                                </Stack>
                            </form>
                        </Paper>

                        {/* Status Cards */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Card sx={{ 
                                    borderRadius: 3, 
                                    bgcolor: 'warning.main', 
                                    color: 'white',
                                    boxShadow: 2,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)'
                                    }
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Pending Assignment</Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{pendingTickets.length}</Typography>
                                            </Box>
                                            <AssignmentIcon sx={{ fontSize: 30, opacity: 0.7 }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card sx={{ 
                                    borderRadius: 3, 
                                    bgcolor: 'primary.main', 
                                    color: 'white',
                                    boxShadow: 2,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)'
                                    }
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Active Support</Typography>
                                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{assignedTickets.length + inProgressTickets.length}</Typography>
                                            </Box>
                                            <TechnicianIcon sx={{ fontSize: 30, opacity: 0.7 }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Right Side: Active Requests & Tracking */}
                    <Grid item xs={12} lg={8} xl={9}>
                        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                Technician Requests
                            </Typography>
                            <Chip label={`Office: ${company.initials}`} color="primary" sx={{ fontWeight: 700 }} />
                        </Box>

                        {/* Pending Requests */}
                        {pendingTickets.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main', mb: 2 }}>
                                    ⏳ Pending Assignment ({pendingTickets.length})
                                </Typography>
                                <Grid container spacing={2}>
                                    {pendingTickets.map((ticket) => (
                                        <Grid item xs={12} key={ticket._id}>
                                            <Card sx={{ borderRadius: 3, border: '2px dashed', borderColor: 'warning.main', bgcolor: 'warning.50' }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Grid container spacing={2} alignItems="center">
                                                        <Grid item xs={12} md={6}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                                <Badge color="warning" variant="dot">
                                                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                                                                        <AssignmentIcon />
                                                                    </Avatar>
                                                                </Badge>
                                                                <Box>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {ticket.buildingWing} • {ticket.category}
                                                                    </Typography>
                                                                    <Chip 
                                                                        label={ticket.priority} 
                                                                        color={getPriorityColor(ticket.priority)}
                                                                        size="small" 
                                                                        sx={{ mt: 1 }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={12} md={6}>
                                                            <Alert icon={false} severity="warning" sx={{ borderRadius: 2 }}>
                                                                🔄 Waiting for Super Admin to assign technician...
                                                            </Alert>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Assigned Tickets */}
                        {assignedTickets.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                                    👨‍🔧 Technician Assigned ({assignedTickets.length})
                                </Typography>
                                <Grid container spacing={2}>
                                    {assignedTickets.map((ticket) => (
                                        <Grid item xs={12} key={ticket._id}>
                                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'primary.main' }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Grid container spacing={2} alignItems="center">
                                                        <Grid item xs={12} md={6}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                                <Badge color="primary" variant="dot">
                                                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                                        <TechnicianIcon />
                                                                    </Avatar>
                                                                </Badge>
                                                                <Box>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {ticket.buildingWing} • {ticket.category}
                                                                    </Typography>
                                                                    {ticket.assignedTechnician && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'accent.main' }}>
                                                                                <TechIcon sx={{ fontSize: 16 }} />
                                                                            </Avatar>
                                                                            <Typography variant="body2" color="primary.main" fontWeight="bold">
                                                                                {ticket.assignedTechnician.name}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={12} md={6}>
                                                            <Alert icon={false} severity="info" sx={{ borderRadius: 2 }}>
                                                                🚀 Technician is on the way to help you!
                                                            </Alert>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* In Progress Tickets */}
                        {inProgressTickets.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main', mb: 2 }}>
                                    🔧 Work In Progress ({inProgressTickets.length})
                                </Typography>
                                <Grid container spacing={2}>
                                    {inProgressTickets.map((ticket) => (
                                        <Grid item xs={12} key={ticket._id}>
                                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'secondary.main' }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Grid container spacing={2} alignItems="center">
                                                        <Grid item xs={12} md={6}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                                <Badge color="secondary" variant="dot">
                                                                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                                        <Engineering />
                                                                    </Avatar>
                                                                </Badge>
                                                                <Box>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {ticket.buildingWing} • {ticket.category}
                                                                    </Typography>
                                                                    {ticket.assignedTechnician && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'accent.main' }}>
                                                                                <TechIcon sx={{ fontSize: 16 }} />
                                                                            </Avatar>
                                                                            <Typography variant="body2" color="secondary.main" fontWeight="bold">
                                                                                {ticket.assignedTechnician.name} is working on it
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={12} md={6}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LinearProgress sx={{ flex: 1 }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    In Progress
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Completed Tickets - Ready for Feedback */}
                        {completedTickets.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', mb: 2 }}>
                                    ✅ Service Completed - Feedback Required ({completedTickets.length})
                                </Typography>
                                <Grid container spacing={2}>
                                    {completedTickets.map((ticket) => (
                                        <Grid item xs={12} key={ticket._id}>
                                            <Card sx={{ 
                                                borderRadius: 3, 
                                                border: '2px solid', 
                                                borderColor: 'success.main',
                                                bgcolor: 'success.50'
                                            }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Grid container spacing={2} alignItems="center">
                                                        <Grid item xs={12} md={6}>
                                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                                                <Badge color="success" variant="dot">
                                                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                                                        <DoneIcon />
                                                                    </Avatar>
                                                                </Badge>
                                                                <Box>
                                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{ticket.title}</Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {ticket.buildingWing} • {ticket.category}
                                                                    </Typography>
                                                                    {ticket.assignedTechnician && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                                                                                <TechIcon sx={{ fontSize: 16 }} />
                                                                            </Avatar>
                                                                            <Typography variant="body2" color="success.main" fontWeight="bold">
                                                                                {ticket.assignedTechnician.name} completed the work
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                size="large"
                                                                startIcon={<FeedbackIcon />}
                                                                onClick={() => handleOpenFeedback(ticket)}
                                                                sx={{ borderRadius: 2, fontWeight: 700 }}
                                                            >
                                                                Rate Service
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* No Active Requests */}
                        {pendingTickets.length === 0 && assignedTickets.length === 0 && 
                         inProgressTickets.length === 0 && completedTickets.length === 0 && (
                            <Paper sx={{ 
                                p: 10, 
                                textAlign: 'center', 
                                borderRadius: 4, 
                                border: '2px dashed', 
                                borderColor: 'divider' 
                            }}>
                                <TechnicianIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No active technician requests
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Submit a request to get technical support for your team
                                </Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            </Box>

            {/* Enhanced Feedback Dialog */}
            <Dialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <StarIcon color="warning" />
                        Rate Your Service Experience
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        {selectedTicket && (
                            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    ✅ {selectedTicket.assignedTechnician?.name || 'Technician'} has completed your request!
                                </Typography>
                            </Alert>
                        )}
                        
                        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                            How satisfied are you with the service?
                        </Typography>
                        
                        <Rating
                            value={rating}
                            onChange={(event, newValue) => setRating(newValue)}
                            size="large"
                            sx={{ 
                                mb: 3,
                                '& .MuiRating-iconFilled': {
                                    color: 'warning.main',
                                },
                                '& .MuiRating-iconHover': {
                                    color: 'warning.main',
                                }
                            }}
                        />
                        
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Share your feedback (Optional)"
                            placeholder="Tell us about your experience. What went well? What could be improved?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                            <Chip 
                                label="Quick Response" 
                                size="small" 
                                variant="outlined" 
                                clickable 
                                onClick={() => setComment(prev => prev + 'Quick response. ')}
                            />
                            <Chip 
                                label="Professional" 
                                size="small" 
                                variant="outlined" 
                                clickable 
                                onClick={() => setComment(prev => prev + 'Very professional service. ')}
                            />
                            <Chip 
                                label="Solved Issue" 
                                size="small" 
                                variant="outlined" 
                                clickable 
                                onClick={() => setComment(prev => prev + 'Problem was resolved effectively. ')}
                            />
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary">
                            Your feedback helps us improve our service quality
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button 
                        onClick={() => setFeedbackOpen(false)}
                        variant="outlined"
                        startIcon={<CloseIcon />}
                    >
                        Maybe Later
                    </Button>
                    <Button 
                        variant="contained" 
                        color="success" 
                        onClick={handleSubmitFeedback} 
                        startIcon={isSubmittingFeedback ? <CircularProgress size={16} /> : <DoneIcon />}
                        disabled={isSubmittingFeedback}
                    >
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TeamLeadDashboard;
