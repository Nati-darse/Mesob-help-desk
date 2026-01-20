import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Card, CardContent, Chip, Avatar,
    Button, IconButton, Tooltip, Badge, LinearProgress, Paper, Tabs, Tab,
    List, ListItem, ListItemText, ListItemIcon, Divider, TextField, Select, MenuItem,
    FormControl, InputLabel, Switch, FormControlLabel
} from '@mui/material';
import {
    Assignment as TaskIcon,
    Schedule as PendingIcon,
    CheckCircle as ResolvedIcon,
    Search as SearchIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Build as BuildIcon,
    Warning as WarningIcon,
    Work as WorkIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';

const TechWorkspace = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dutyStatus, setDutyStatus] = useState('Active');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAssignedTickets();
    }, []);

    const fetchAssignedTickets = async () => {
        try {
            const res = await axios.get('/api/technician/assigned');
            setTickets(res.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority, createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const hoursElapsed = (now - created) / (1000 * 60 * 60);

        if (priority === 'Critical') {
            return hoursElapsed > 1 ? '#0a192f' : '#153b8a'; // Deep Navy if >1hr
        } else if (priority === 'High') {
            return hoursElapsed > 4 ? '#1e4fb1' : '#0061f2'; // Brand Blue if >4hrs
        }
        return '#42a5f5'; // Light Blue for normal
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

    const TicketCard = ({ ticket }) => {
        const priorityColor = getPriorityColor(ticket.priority, ticket.createdAt);
        const slaStatus = getSLABadge(ticket.priority, ticket.createdAt);
        const isSLABreach = slaStatus === 'SLA BREACH';

        return (
            <Card
                sx={{
                    mb: 2,
                    cursor: 'pointer',
                    border: isSLABreach ? `2px solid ${priorityColor}` : '1px solid #e0e0e0',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3
                    }
                }}
                onClick={() => setSelectedTicket(ticket)}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: priorityColor, color: 'white', mr: 2, width: 32, height: 32 }}>
                                <TaskIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    {ticket.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {ticket.company?.initials || 'Unknown'} • Ticket #{ticket._id?.slice(-6)}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Chip
                                label={slaStatus}
                                color={isSLABreach ? 'error' : 'success'}
                                size="small"
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {new Date(ticket.createdAt).toLocaleTimeString()}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                            label={ticket.priority}
                            size="small"
                            sx={{
                                bgcolor: priorityColor,
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {ticket.location || 'No location'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const DutyPulse = () => (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <StatusIcon
                sx={{
                    color: dutyStatus === 'Active' ? '#1e4fb1' :
                        dutyStatus === 'On-Site' ? '#0061f2' :
                            dutyStatus === 'Break' ? '#42a5f5' : '#9e9e9e',
                    mr: 1,
                    fontSize: 12
                }}
            />
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {dutyStatus}
            </Typography>
        </Box>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Typography>Loading workspace...</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header with Duty Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">
                    Tech Workspace - Mission Control
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        Duty Status:
                    </Typography>
                    <FormControl size="small">
                        <Select
                            value={dutyStatus}
                            onChange={(e) => setDutyStatus(e.target.value)}
                            sx={{ minWidth: 120 }}
                        >
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="On-Site">On-Site</MenuItem>
                            <MenuItem value="Break">Break</MenuItem>
                            <MenuItem value="Offline">Offline</MenuItem>
                        </Select>
                    </FormControl>
                    <DutyPulse />
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Main Content - 8 columns */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, minHeight: 600 }}>
                        {/* Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                                <Tab icon={<TaskIcon />} label="Active Tasks" />
                                <Tab icon={<PendingIcon />} label="Pending Feedback" />
                                <Tab icon={<ResolvedIcon />} label="Today's Resolved" />
                            </Tabs>
                        </Box>

                        {/* Tab Content */}
                        <Box sx={{ mt: 3 }}>
                            {activeTab === 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Active Tasks ({tickets.filter(t => t.status === 'Open').length})
                                    </Typography>
                                    {tickets.filter(t => t.status === 'Open').map(ticket => (
                                        <TicketCard key={ticket._id} ticket={ticket} />
                                    ))}
                                </Box>
                            )}

                            {activeTab === 1 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Pending Feedback ({tickets.filter(t => t.status === 'Pending Feedback').length})
                                    </Typography>
                                    {tickets.filter(t => t.status === 'Pending Feedback').map(ticket => (
                                        <TicketCard key={ticket._id} ticket={ticket} />
                                    ))}
                                </Box>
                            )}

                            {activeTab === 2 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Today's Resolved ({tickets.filter(t => t.status === 'Resolved' &&
                                            new Date(t.resolvedAt).toDateString() === new Date().toDateString()).length})
                                    </Typography>
                                    {tickets.filter(t => t.status === 'Resolved' &&
                                        new Date(t.resolvedAt).toDateString() === new Date().toDateString()).map(ticket => (
                                            <TicketCard key={ticket._id} ticket={ticket} />
                                        ))}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Sidebar - 4 columns */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={2}>
                        {/* Performance Stats */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 2, background: 'linear-gradient(135deg, #0a192f 0%, #1a237e 100%)' }}>
                                <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {tickets.filter(t => t.status === 'Resolved').length}
                                    </Typography>
                                    <Typography variant="body2">
                                        Total Resolved
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(tickets.filter(t => t.status === 'Resolved').length / Math.max(tickets.length, 1)) * 100}
                                        sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)' }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Quick Actions */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Quick Actions
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<LocationIcon />}
                                        fullWidth
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        On-site Now
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<BuildIcon />}
                                        fullWidth
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        Waiting for Parts
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<WarningIcon />}
                                        fullWidth
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        Escalate to Team Lead
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Global Search */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Global Search
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search past solutions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                    }}
                                />
                            </Card>
                        </Grid>

                        {/* Company Context */}
                        {selectedTicket && (
                            <Grid item xs={12}>
                                <Card sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Current Context
                                    </Typography>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="primary">
                                            {selectedTicket.company?.name || 'Unknown Company'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedTicket.company?.initials || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Employee:</strong> {selectedTicket.requester?.name || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Location:</strong> {selectedTicket.location || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>IT Policy:</strong> {selectedTicket.company?.initials} Standard Procedures
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TechWorkspace;
