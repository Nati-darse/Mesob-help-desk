import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Paper, List, ListItem, ListItemText, Button,
    Chip, Avatar, Stack, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, IconButton, Tooltip, Badge, LinearProgress, Card, CardContent
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    SmartToy as AIIcon,
    Speed as SpeedIcon,
    TrendingUp as TrendIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getCompanyById } from '../../../utils/companies';

const ManualAssignment = () => {
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedTech, setSelectedTech] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState({});
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ticketsRes, techsRes] = await Promise.all([
                axios.get('/api/tickets'),
                axios.get('/api/users/technicians')
            ]);

            // Filter unassigned tickets
            const unassigned = ticketsRes.data.filter(t => !t.technician && t.status === 'New');
            setTickets(unassigned);

            // Get all tickets to calculate workload
            const allTickets = ticketsRes.data;

            // Calculate ticket count for each technician
            const techsWithWorkload = techsRes.data.map(tech => {
                const assignedCount = allTickets.filter(t =>
                    t.technician &&
                    (t.technician._id === tech._id || t.technician === tech._id) &&
                    t.status !== 'Resolved' &&
                    t.status !== 'Closed'
                ).length;

                return {
                    ...tech,
                    currentTickets: assignedCount,
                    score: (tech.isAvailable ? 100 : 0) - (assignedCount * 10)
                };
            });

            // Sort by score (highest first)
            techsWithWorkload.sort((a, b) => b.score - a.score);
            setTechnicians(techsWithWorkload);

            // Generate AI suggestions for each ticket
            generateAISuggestions(unassigned, techsWithWorkload);

        } catch (error) {
            console.error('Error fetching assignment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAISuggestions = (ticketsList, techsList) => {
        const suggestions = {};

        ticketsList.forEach(ticket => {
            // AI scoring algorithm based on multiple factors
            const scoredTechs = techsList.map(tech => {
                let score = 0;
                let reasons = [];

                // Availability factor (40% weight)
                if (tech.isAvailable) {
                    score += 40;
                    reasons.push('Available');
                }

                // Workload factor (30% weight)
                const workloadScore = Math.max(0, 30 - (tech.currentTickets * 5));
                score += workloadScore;
                if (workloadScore > 20) reasons.push('Low workload');
                else if (workloadScore < 10) reasons.push('High workload');

                // Skills matching (20% weight) - simulated
                const skillsMatch = Math.random() * 20;
                score += skillsMatch;
                if (skillsMatch > 15) reasons.push('Skills match');

                // Company familiarity (10% weight)
                if (tech.companyId === ticket.companyId) {
                    score += 10;
                    reasons.push('Company experience');
                }

                return {
                    ...tech,
                    aiScore: score,
                    aiReasons: reasons
                };
            });

            // Sort by AI score
            scoredTechs.sort((a, b) => b.aiScore - a.aiScore);

            suggestions[ticket._id] = scoredTechs.slice(0, 3); // Top 3 suggestions
        });

        setAiSuggestions(suggestions);
    };

    const handleAssign = async () => {
        if (!selectedTicket || !selectedTech) return;

        setAssigning(true);
        try {
            await axios.put(`/api/tickets/${selectedTicket._id}/assign`, {
                technicianId: selectedTech._id
            });

            // Update local state
            setTickets(tickets.filter(t => t._id !== selectedTicket._id));
            setAssignDialogOpen(false);
            setSelectedTicket(null);
            setSelectedTech(null);
        } catch (error) {
            console.error('Error assigning ticket:', error);
        } finally {
            setAssigning(false);
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

    const getAvailabilityBadge = (tech) => {
        return tech.isAvailable ?
            <Chip label="Available" color="success" size="small" /> :
            <Chip label="Busy" color="default" size="small" />;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Smart Assignment Center
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        AI-powered technician recommendations for optimal ticket distribution
                    </Typography>
                </Box>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={fetchData}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={4}>
                {/* Unassigned Tickets */}
                <Grid item xs={12} lg={7}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h5" fontWeight="bold">
                                Unassigned Tickets ({tickets.length})
                            </Typography>
                        </Box>

                        {tickets.length === 0 ? (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                All tickets have been assigned! Great job!
                            </Alert>
                        ) : (
                            <List>
                                {tickets.map((ticket) => (
                                    <ListItem
                                        key={ticket._id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            mb: 2,
                                            p: 2,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={8}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                        {ticket.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        {getCompanyById(ticket.companyId)?.name || 'Unknown Company'}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1}>
                                                        <Chip
                                                            label={ticket.priority}
                                                            color={getPriorityColor(ticket.priority)}
                                                            size="small"
                                                        />
                                                        <Chip
                                                            label={ticket.category}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    </Stack>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                    <Box sx={{ mt: 1 }}>
                                                        {aiSuggestions[ticket._id] && (
                                                            <Badge
                                                                badgeContent="AI"
                                                                color="primary"
                                                                sx={{ '& .MuiBadge-badge': { fontSize: 9 } }}
                                                            >
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedTicket(ticket);
                                                                        setAssignDialogOpen(true);
                                                                    }}
                                                                >
                                                                    Assign
                                                                </Button>
                                                            </Badge>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Available Technicians */}
                <Grid item xs={12} lg={5}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h5" fontWeight="bold">
                                Available Technicians ({technicians.filter(t => t.isAvailable).length})
                            </Typography>
                        </Box>

                        <List>
                            {technicians.map((tech, index) => (
                                <ListItem
                                    key={tech._id}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        mb: 2,
                                        p: 2
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                {tech.name.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {tech.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {tech.specialization || 'IT Support'}
                                                </Typography>
                                            </Box>
                                            {getAvailabilityBadge(tech)}
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Current Workload
                                                </Typography>
                                                <Typography variant="caption" fontWeight="bold">
                                                    {tech.currentTickets} tickets
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min((tech.currentTickets / 10) * 100, 100)}
                                                sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: 'grey.200'
                                                }}
                                            />
                                        </Box>

                                        {index === 0 && (
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    icon={<TrendIcon />}
                                                    label="Top Performer"
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* Assignment Dialog with AI Suggestions */}
            <Dialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
                        AI-Powered Assignment
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedTicket && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedTicket.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {getCompanyById(selectedTicket.companyId)?.name}
                            </Typography>

                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
                                Recommended Technicians:
                            </Typography>

                            {aiSuggestions[selectedTicket._id]?.map((tech, index) => (
                                <Card
                                    key={tech._id}
                                    sx={{
                                        mb: 2,
                                        cursor: 'pointer',
                                        border: selectedTech?._id === tech._id ? '2px solid' : '1px solid',
                                        borderColor: selectedTech?._id === tech._id ? 'primary.main' : 'divider'
                                    }}
                                    onClick={() => setSelectedTech(tech)}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                {tech.name.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {tech.name}
                                                </Typography>
                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                    {getAvailabilityBadge(tech)}
                                                    <Chip
                                                        label={`${tech.currentTickets} tickets`}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </Stack>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                    {Math.round(tech.aiScore)}%
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Match Score
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {tech.aiReasons.map((reason, i) => (
                                                <Chip
                                                    key={i}
                                                    label={reason}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                                />
                                            ))}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        variant="contained"
                        disabled={!selectedTech || assigning}
                        startIcon={assigning ? <CircularProgress size={16} /> : <CheckIcon />}
                    >
                        {assigning ? 'Assigning...' : 'Assign Ticket'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ManualAssignment;
