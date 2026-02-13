import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import {
    Container, Typography, Box, Grid, Paper, List, ListItem, ListItemText, Button,
    Chip, Avatar, Stack, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, IconButton, Tooltip, Badge, LinearProgress, Card, CardContent,
    TextField, InputAdornment, Tabs, Tab, MenuItem
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    SmartToy as AIIcon,
    Speed as SpeedIcon,
    TrendingUp as TrendIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatCompanyLabel, getCompanyById, getCompanyDisplayName } from '../../../utils/companies';
import { useAuth } from '../../auth/context/AuthContext';
import { getStatusColor } from '../../../utils/ticketStatus';

const ManualAssignment = () => {
    const [tickets, setTickets] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedTech, setSelectedTech] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState({});
    const [techFilter, setTechFilter] = useState('all');
    const [techSearch, setTechSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [ticketSearch, setTicketSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [slaFilter, setSlaFilter] = useState('all');
    const [sortBy, setSortBy] = useState('age'); // age | priority
    const [sortDir, setSortDir] = useState('desc'); // desc | asc
    const [analyzing, setAnalyzing] = useState(false);
    const { user } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        fetchData();

        // Socket logic for real-time status updates
        if (user) {
            const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
                transports: ['websocket'],
                auth: { companyId: user.companyId },
                extraHeaders: { 'x-tenant-id': String(user.companyId || '') }
            });

            socketRef.current = socket;
            socket.emit('join_company', user.companyId);

            socket.on('technician_status_updated', (updatedTech) => {
                setTechnicians(prev => prev.map(tech =>
                    tech._id === updatedTech._id ? { ...tech, ...updatedTech } : tech
                ));
            });

            socket.on('ticket_updated', () => {
                // Refresh data when tickets change to update workloads too
                fetchData();
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user]);

    useEffect(() => {
        const handle = setTimeout(() => setDebouncedSearch(techSearch), 300);
        return () => clearTimeout(handle);
    }, [techSearch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Tickets fetch
            try {
                const ticketsRes = await axios.get('/api/tickets?onlyUnassigned=true&pageSize=200');
                const unassigned = ticketsRes.data;
                setTickets(unassigned);

                // Techs fetch
                try {
                    const techsRes = await axios.get('/api/users/technicians?includeWorkload=true');
                    const techsWithWorkload = techsRes.data.map(tech => {
                        const assignedCount = tech.currentTickets || 0;
                        return {
                            ...tech,
                            currentTickets: assignedCount,
                            score: (tech.isAvailable ? 100 : 0) - (assignedCount * 10)
                        };
                    });
                    techsWithWorkload.sort((a, b) => b.score - a.score);
                    setTechnicians(techsWithWorkload);
                    generateAISuggestions(unassigned, techsWithWorkload);
                } catch (techError) {
                    console.error('Failed to load technicians:', techError);
                }

            } catch (ticketError) {
                console.error('Failed to load tickets:', ticketError);
            }
        } finally {
            setLoading(false);
        }
    };

    const generateAISuggestions = (ticketsList, techsList) => {
        const suggestions = {};

        ticketsList.forEach(ticket => {
            // AI scoring algorithm based on real data factors
            const scoredTechs = techsList.map(tech => {
                let score = 0;
                let reasons = [];

                // 1. Availability factor (40% weight)
                if (tech.isAvailable) {
                    score += 40;
                    reasons.push('Current Availability');
                }

                // 2. Workload factor (30% weight)
                const workloadScore = Math.max(0, 30 - (tech.currentTickets * 5));
                score += workloadScore;
                if (tech.currentTickets < 2) reasons.push('Low current load');
                else if (tech.currentTickets > 5) reasons.push('High current load');

                // 3. Department Match (20% weight)
                if (tech.department === ticket.category || tech.department === 'IT Operations') {
                    score += 20;
                    reasons.push(`${tech.department} Specialist`);
                }

                // 4. Company familiarity (10% weight)
                if (String(tech.companyId) === String(ticket.companyId)) {
                    score += 10;
                    reasons.push('On-site Personnel');
                }

                return {
                    ...tech,
                    aiScore: Math.min(score, 100),
                    aiReasons: reasons.length > 0 ? reasons : ['General Support']
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

    const handleAutoAssign = async () => {
        if (!selectedTicket) return;

        setAssigning(true);
        try {
            await axios.put(`/api/tickets/${selectedTicket._id}/assign`, {
                autoAssign: true
            });

            setTickets(tickets.filter(t => t._id !== selectedTicket._id));
            setAssignDialogOpen(false);
            setSelectedTicket(null);
            setSelectedTech(null);
        } catch (error) {
            console.error('Error auto-assigning ticket:', error);
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

    const isSlaBreached = (ticket) => {
        if (!ticket || ticket.status === 'Closed' || ticket.status === 'Resolved') return false;
        if (ticket.slaBreached) return true;
        if (!ticket.slaDueAt) return false;
        return new Date(ticket.slaDueAt).getTime() < Date.now();
    };

    const getAvailabilityBadge = (tech) => {
        const status = tech.dutyStatus || (tech.isAvailable ? 'Online' : 'Offline');
        switch (status) {
            case 'Online': return <Chip label="Online" color="success" size="small" />;
            case 'On-Site': return <Chip label="On-Site" color="primary" size="small" />;
            case 'Break': return <Chip label="On Break" color="warning" size="small" />;
            case 'Offline': return <Chip label="Offline" color="error" size="small" />;
            default: return <Chip label={status} size="small" />;
        }
    };

    const getCompanyLabel = (companyId) => {
        const company = getCompanyById(companyId);
        return company ? formatCompanyLabel(company) : 'Unknown Company';
    };

    const filteredTechnicians = useMemo(() => {
        return technicians.filter(tech => {
            const matchesSearch = tech.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                tech.department?.toLowerCase().includes(debouncedSearch.toLowerCase());

            const currentStatus = tech.dutyStatus || (tech.isAvailable ? 'Online' : 'Offline');
            const matchesStatus = techFilter === 'all' ||
                (techFilter.toLowerCase() === currentStatus.toLowerCase());

            return matchesSearch && matchesStatus;
        });
    }, [technicians, techFilter, debouncedSearch]);

    const filteredTickets = useMemo(() => {
        let list = [...tickets];
        const search = ticketSearch.trim().toLowerCase();

        if (search) {
            list = list.filter(t => {
                const company = getCompanyById(t.companyId);
                const companySearchText = [
                    company?.name,
                    getCompanyDisplayName(company),
                    company?.initials,
                    company ? formatCompanyLabel(company) : ''
                ].filter(Boolean).join(' ');
                return (
                    t.title?.toLowerCase().includes(search) ||
                    t.category?.toLowerCase().includes(search) ||
                    companySearchText.toLowerCase().includes(search)
                );
            });
        }

        if (priorityFilter !== 'all') {
            list = list.filter(t => t.priority === priorityFilter);
        }

        if (slaFilter !== 'all') {
            list = list.filter(t => (slaFilter === 'breached' ? isSlaBreached(t) : !isSlaBreached(t)));
        }

        const priorityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        list.sort((a, b) => {
            if (sortBy === 'priority') {
                const aRank = priorityRank[a.priority] || 0;
                const bRank = priorityRank[b.priority] || 0;
                return sortDir === 'desc' ? bRank - aRank : aRank - bRank;
            }
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return sortDir === 'desc' ? bTime - aTime : aTime - bTime;
        });

        return list;
    }, [tickets, ticketSearch, priorityFilter, slaFilter, sortBy, sortDir]);

    const hasTechnicians = technicians.length > 0;

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
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' } }}>
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
                    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h5" fontWeight="bold">
                                Unassigned Tickets ({filteredTickets.length})
                            </Typography>
                        </Box>

                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={5}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder="Search tickets..."
                                        value={ticketSearch}
                                        onChange={(e) => setTicketSearch(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon size={18} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4} md={2.5}>
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        label="Priority"
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="Critical">Critical</MenuItem>
                                        <MenuItem value="High">High</MenuItem>
                                        <MenuItem value="Medium">Medium</MenuItem>
                                        <MenuItem value="Low">Low</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4} md={2.5}>
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        label="SLA"
                                        value={slaFilter}
                                        onChange={(e) => setSlaFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="breached">Breached</MenuItem>
                                        <MenuItem value="ok">Within SLA</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4} md={2}>
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        label="Sort"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <MenuItem value="age">Age</MenuItem>
                                        <MenuItem value="priority">Priority</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4} md={1}>
                                    <TextField
                                        select
                                        size="small"
                                        fullWidth
                                        label="Order"
                                        value={sortDir}
                                        onChange={(e) => setSortDir(e.target.value)}
                                    >
                                        <MenuItem value="desc">↓</MenuItem>
                                        <MenuItem value="asc">↑</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Paper>

                        {tickets.length === 0 ? (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                All tickets have been assigned! Great job!
                            </Alert>
                        ) : filteredTickets.length === 0 ? (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                No tickets match the current filters.
                            </Alert>
                        ) : (
                            <List>
                                {filteredTickets.map((ticket) => (
                                    <ListItem
                                        key={ticket._id}
                                        sx={{
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            mb: 2,
                                            p: { xs: 1.5, sm: 2 },
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'action.hover',
                                                boxShadow: 1
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
                                                        {getCompanyLabel(ticket.companyId)}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
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
                                                        <Chip
                                                            label={ticket.status}
                                                            variant="outlined"
                                                            size="small"
                                                            color={getStatusColor(ticket.status)}
                                                        />
                                                        {isSlaBreached(ticket) && (
                                                            <Chip
                                                                label="SLA BREACH"
                                                                size="small"
                                                                color="error"
                                                                sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900 }}
                                                            />
                                                        )}
                                                    </Stack>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
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
                                                                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                                                                    disabled={!hasTechnicians}
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
                    <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
                            <Typography variant="h5" fontWeight="bold">
                                Workforce Status ({technicians.length})
                            </Typography>
                        </Box>

                        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search personnel..."
                                value={techSearch}
                                onChange={(e) => setTechSearch(e.target.value)}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon size={18} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Tabs
                                value={techFilter}
                                onChange={(_, v) => setTechFilter(v)}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ minHeight: 36, '& .MuiTab-root': { py: 0.5, minHeight: 36, fontSize: '0.7rem' } }}
                            >
                                <Tab label="All" value="all" />
                                <Tab label="Online" value="Online" />
                                <Tab label="On-Site" value="On-Site" />
                                <Tab label="Break" value="Break" />
                                <Tab label="Offline" value="Offline" />
                            </Tabs>
                        </Paper>

                        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                            {filteredTechnicians.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No personnel found</Typography>
                                </Box>
                            ) : (
                                filteredTechnicians.map((tech, index) => (
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
                                )))}
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
                                {getCompanyLabel(selectedTicket.companyId)}
                            </Typography>

                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
                                Recommended Technicians (AI):
                            </Typography>

                            {!hasTechnicians && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    No technicians are currently available. Please add technicians or check availability.
                                </Alert>
                            )}

                            {aiSuggestions[selectedTicket._id]?.map((tech, index) => (
                                <Card
                                    key={`ai-${tech._id}`}
                                    sx={{
                                        mb: 2,
                                        cursor: 'pointer',
                                        border: selectedTech?._id === tech._id ? '2px solid' : '1px solid',
                                        borderColor: selectedTech?._id === tech._id ? 'primary.main' : 'divider',
                                        bgcolor: selectedTech?._id === tech._id ? 'primary.50' : 'background.paper'
                                    }}
                                    onClick={() => setSelectedTech(tech)}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main', border: '2px solid', borderColor: 'background.paper', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                {tech.name.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {tech.name}
                                                </Typography>
                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                    {getAvailabilityBadge(tech)}
                                                    <Chip
                                                        label={`${tech.currentTickets} active`}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                                    />
                                                </Stack>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                    {Math.round(tech.aiScore)}%
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Match
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.round(tech.aiScore)}
                                            sx={{ height: 6, borderRadius: 3, mb: 1 }}
                                        />
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {tech.aiReasons.map((reason, i) => (
                                                <Chip
                                                    key={i}
                                                    label={reason}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'primary.50' }}
                                                />
                                            ))}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            <Divider sx={{ my: 3 }}>
                                <Chip label="All Personnel" size="small" variant="outlined" />
                            </Divider>

                            <Box sx={{ maxHeight: 300, overflow: 'auto', pr: 1 }}>
                                <Stack spacing={1}>
                                    {technicians.map(tech => (
                                        <Paper
                                            key={`all-${tech._id}`}
                                            onClick={() => setSelectedTech(tech)}
                                            sx={{
                                                p: 1.5,
                                                cursor: 'pointer',
                                                border: '1px solid',
                                                borderColor: selectedTech?._id === tech._id ? 'primary.main' : 'divider',
                                                bgcolor: selectedTech?._id === tech._id ? 'primary.50' : (tech.isAvailable ? 'background.paper' : '#fcfcfc'),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                opacity: tech.isAvailable ? 1 : 0.8
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Badge
                                                    variant="dot"
                                                    color={tech.isAvailable ? 'success' : 'error'}
                                                    overlap="circular"
                                                >
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>{tech.name.charAt(0)}</Avatar>
                                                </Badge>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontSize: '0.85rem' }}>{tech.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{tech.department || 'IT Operations'}</Typography>
                                                </Box>
                                            </Box>
                                            <Chip
                                                label={tech.isAvailable ? 'On-Duty' : 'Off-Duty'}
                                                size="small"
                                                color={tech.isAvailable ? 'success' : 'default'}
                                                variant={tech.isAvailable ? 'filled' : 'outlined'}
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAutoAssign}
                        variant="outlined"
                        disabled={assigning || !hasTechnicians || !aiSuggestions[selectedTicket?._id]?.length}
                        startIcon={assigning ? <CircularProgress size={16} /> : <AIIcon />}
                    >
                        Auto Assign Best
                    </Button>
                    <Button
                        onClick={handleAssign}
                        variant="contained"
                        disabled={!selectedTech || assigning || !hasTechnicians}
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
