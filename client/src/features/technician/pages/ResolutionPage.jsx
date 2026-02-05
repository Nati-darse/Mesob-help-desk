import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, Paper, TextField, 
    Button, Chip, Avatar, Divider, Select, MenuItem,
    FormControl, InputLabel, Switch, FormControlLabel, IconButton, Tooltip
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
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    Assignment as TaskIcon
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
        nextSteps: ''
    });
    const [timeline, setTimeline] = useState([]);

    const qc = useQueryClient();

    useEffect(() => {
        if (id) {
            fetchTicketDetails();
        }
    }, [id]);

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
            <Grid container spacing={3}>
                {/* Left: Ticket Details */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: { xs: 2, sm: 3 }, minHeight: { xs: 'auto', md: 600 } }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 3 }}>
                            <Box>
                                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
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
                                        label={ticket.company?.initials || 'Unknown'}
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
                            </Box>
                            
                            {/* Quick Actions */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                                            disabled={!resolutionData.category || !resolutionData.resolutionCode}
                                            sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                            <Card sx={{ p: { xs: 2, sm: 3 }, background: '#f5f5f5' }}>
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
                                    sx={{ mt: 1, width: { xs: '100%', sm: 'auto' } }}
                                >
                                    Save Notes
                                </Button>
                            </Card>
                        </Grid>

                        {/* Customer Updates */}
                        <Grid item xs={12}>
                            <Card sx={{ p: { xs: 2, sm: 3 } }}>
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
                                    sx={{ mt: 1, width: { xs: '100%', sm: 'auto' } }}
                                    disabled={!customerUpdate.trim()}
                                >
                                    Send Update
                                </Button>
                            </Card>
                        </Grid>

                        {/* Contact Info */}
                        <Grid item xs={12}>
                            <Card sx={{ p: { xs: 2, sm: 3 } }}>
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
        </Container>
    );
};

export default ResolutionPage;
