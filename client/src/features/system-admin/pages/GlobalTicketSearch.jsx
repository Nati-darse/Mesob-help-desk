import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, Card, CardContent, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
    MenuItem, FormControl, InputLabel, Select, Tooltip, Badge
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Assignment as AssignmentIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Schedule as ScheduleIcon,
    PriorityHigh as PriorityIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';
import { getCompanyById } from '../../../utils/companies';

const GlobalTicketSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        ticketId: '',
        companyId: '',
        status: '',
        priority: ''
    });
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [detailsDialog, setDetailsDialog] = useState(false);
    const [emergencyDialog, setEmergencyDialog] = useState(false);
    const [reassignData, setReassignData] = useState({
        newCompanyId: '',
        newTechnicianId: '',
        reason: ''
    });

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(searchParams).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await axios.get(`/api/system-admin/tickets/global-search?${params}`);
            setTickets(response.data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmergencyReassign = async () => {
        try {
            await axios.put(`/api/system-admin/tickets/${selectedTicket._id}/emergency-reassign`, reassignData);
            setEmergencyDialog(false);
            setReassignData({ newCompanyId: '', newTechnicianId: '', reason: '' });
            handleSearch(); // Refresh results
            alert('Ticket reassigned successfully');
        } catch (error) {
            console.error('Reassignment failed:', error);
            alert('Failed to reassign ticket');
        }
    };

    const clearSearch = () => {
        setSearchParams({
            query: '',
            ticketId: '',
            companyId: '',
            status: '',
            priority: ''
        });
        setTickets([]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'error';
            case 'In Progress': return 'warning';
            case 'Resolved': return 'success';
            case 'Closed': return 'default';
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <Box maxWidth="1600px" margin="0 auto">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929', mb: 1 }}>
                    🔍 Global Ticket Search
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Search and manage tickets across all organizations with emergency controls
                </Typography>
            </Box>

            {/* Search Form */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Advanced Search Filters
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search Query"
                            placeholder="Title, description..."
                            value={searchParams.query}
                            onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            label="Ticket ID"
                            placeholder="Exact ticket ID"
                            value={searchParams.ticketId}
                            onChange={(e) => setSearchParams(prev => ({ ...prev, ticketId: e.target.value }))}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            label="Company ID"
                            type="number"
                            value={searchParams.companyId}
                            onChange={(e) => setSearchParams(prev => ({ ...prev, companyId: e.target.value }))}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={searchParams.status}
                                label="Status"
                                onChange={(e) => setSearchParams(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <MenuItem value="">All Statuses</MenuItem>
                                <MenuItem value="Open">Open</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Resolved">Resolved</MenuItem>
                                <MenuItem value="Closed">Closed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={searchParams.priority}
                                label="Priority"
                                onChange={(e) => setSearchParams(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                <MenuItem value="">All Priorities</MenuItem>
                                <MenuItem value="Critical">Critical</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={1}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleSearch}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                                fullWidth
                            >
                                Search
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {tickets.length > 0 && `Found ${tickets.length} tickets`}
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearSearch}
                        size="small"
                    >
                        Clear All
                    </Button>
                </Box>
            </Paper>

            {/* Search Results */}
            {tickets.length > 0 && (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ticket ID</TableCell>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Organization</TableCell>
                                    <TableCell>Requester</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {ticket._id.slice(-8)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                                {ticket.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <BusinessIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {getCompanyById(ticket.companyId)?.name || `Company ${ticket.companyId}`}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Box>
                                                    <Typography variant="body2">
                                                        {ticket.requester?.name || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {ticket.requester?.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ticket.status}
                                                size="small"
                                                color={getStatusColor(ticket.status)}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ticket.priority}
                                                size="small"
                                                color={getPriorityColor(ticket.priority)}
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {formatDate(ticket.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setDetailsDialog(true);
                                                        }}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Emergency Reassign">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setEmergencyDialog(true);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* No Results */}
            {!loading && tickets.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tickets found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Try adjusting your search criteria or use different filters
                    </Typography>
                </Paper>
            )}

            {/* Ticket Details Dialog */}
            <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Ticket Details: {selectedTicket?._id.slice(-8)}
                </DialogTitle>
                <DialogContent>
                    {selectedTicket && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    {selectedTicket.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {selectedTicket.description}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip 
                                    label={selectedTicket.status} 
                                    color={getStatusColor(selectedTicket.status)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                                <Chip 
                                    label={selectedTicket.priority} 
                                    color={getPriorityColor(selectedTicket.priority)}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
                                <Typography variant="body2">
                                    {getCompanyById(selectedTicket.companyId)?.name || `Company ${selectedTicket.companyId}`}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Requester</Typography>
                                <Typography variant="body2">
                                    {selectedTicket.requester?.name} ({selectedTicket.requester?.email})
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Technician</Typography>
                                <Typography variant="body2">
                                    {selectedTicket.technician?.name || 'Unassigned'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                                <Typography variant="body2">
                                    {formatDate(selectedTicket.createdAt)}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialog(false)}>Close</Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={() => {
                            setDetailsDialog(false);
                            setEmergencyDialog(true);
                        }}
                    >
                        Emergency Reassign
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Emergency Reassignment Dialog */}
            <Dialog open={emergencyDialog} onClose={() => setEmergencyDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Emergency Ticket Reassignment
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        This is an emergency action that will be logged and audited. Use only when necessary.
                    </Alert>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Company ID (optional)"
                                type="number"
                                value={reassignData.newCompanyId}
                                onChange={(e) => setReassignData(prev => ({ ...prev, newCompanyId: e.target.value }))}
                                helperText="Leave empty to keep current company"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Technician ID (optional)"
                                value={reassignData.newTechnicianId}
                                onChange={(e) => setReassignData(prev => ({ ...prev, newTechnicianId: e.target.value }))}
                                helperText="Leave empty to unassign"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Reason for Emergency Reassignment"
                                multiline
                                rows={3}
                                value={reassignData.reason}
                                onChange={(e) => setReassignData(prev => ({ ...prev, reason: e.target.value }))}
                                required
                                helperText="This reason will be logged in the audit trail"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmergencyDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={handleEmergencyReassign}
                        disabled={!reassignData.reason.trim()}
                    >
                        Execute Emergency Reassignment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GlobalTicketSearch;