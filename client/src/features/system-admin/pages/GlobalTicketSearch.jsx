import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Select,
    MenuItem, FormControl, InputLabel, Grid, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert,
    IconButton, Tooltip, Pagination, InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Visibility as ViewIcon,
    Assignment as AssignIcon,
    Download as ExportIcon,
    Clear as ClearIcon,
    Business as BusinessIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById, formatCompanyLabel } from '../../../utils/companies';

const GlobalTicketSearch = () => {
    // Real ticket data fetch
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        category: 'all',
        company: 'all',
        assignee: 'all',
        dateFrom: null,
        dateTo: null
    });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [viewDialog, setViewDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/tickets?pageSize=1000');
            setTickets(res.data);
            setFilteredTickets(res.data);
            setTotalPages(Math.ceil(res.data.length / itemsPerPage));
        } catch (error) {
            console.error('Error fetching global tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        applyFilters();
    }, [searchQuery, filters, tickets]);

    const applyFilters = () => {
        let filtered = tickets.filter(ticket => {
            const orgLabel = formatCompanyLabel(getCompanyById(ticket.companyId));
            const requesterName = ticket.requester?.name || ticket.requester || '';
            const matchesSearch = !searchQuery ||
                ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                orgLabel.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
            const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;
            const matchesCategory = filters.category === 'all' || ticket.category === filters.category;
            const matchesCompany = filters.company === 'all' || ticket.companyId === parseInt(filters.company);
            const matchesAssignee = filters.assignee === 'all' ||
                (ticket.technician?.name === filters.assignee);

            const ticketDate = new Date(ticket.createdAt);
            const matchesDateFrom = !filters.dateFrom || ticketDate >= filters.dateFrom;
            const matchesDateTo = !filters.dateTo || ticketDate <= filters.dateTo;

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory &&
                matchesCompany && matchesAssignee && matchesDateFrom && matchesDateTo;
        });

        setFilteredTickets(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setPage(1);
    };

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setViewDialog(true);
    };

    const getTicketOrganizationLabel = (ticket) => formatCompanyLabel(getCompanyById(ticket.companyId));
    const getRequesterName = (ticket) => ticket.requester?.name || ticket.requester || 'Unknown';
    const getAssigneeName = (ticket) => ticket.technician?.name || ticket.assignee || 'Unassigned';

    const handleExport = () => {
        const csvContent = [
            ['Ticket ID', 'Title', 'Status', 'Priority', 'Organization', 'Requester', 'Created Date'].join(','),
            ...filteredTickets.map(ticket => [
                ticket._id || ticket.id,
                `"${ticket.title}"`,
                ticket.status,
                ticket.priority,
                `"${getTicketOrganizationLabel(ticket)}"`,
                `"${getRequesterName(ticket)}"`,
                new Date(ticket.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `global-tickets-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({
            status: 'all',
            priority: 'all',
            category: 'all',
            company: 'all',
            assignee: 'all',
            dateFrom: null,
            dateTo: null
        });
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
            case 'High': return 'error';
            case 'Medium': return 'warning';
            case 'Low': return 'info';
            default: return 'default';
        }
    };

    const paginatedTickets = filteredTickets.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Global Ticket Search
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={handleExport}
                        disabled={filteredTickets.length === 0}
                    >
                        Export Results
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </Button>
                </Box>
            </Box>

            {/* Search and Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Search Tickets"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ticket ID, title, or requester..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterIcon color="action" />
                            <Typography variant="subtitle2" color="text.secondary">
                                {filteredTickets.length} of {tickets.length} tickets
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="Open">Open</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Resolved">Resolved</MenuItem>
                                <MenuItem value="Closed">Closed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={filters.priority}
                                label="Priority"
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            >
                                <MenuItem value="all">All Priorities</MenuItem>
                                <MenuItem value="High">High</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            >
                                <MenuItem value="all">All Categories</MenuItem>
                                <MenuItem value="Hardware">Hardware</MenuItem>
                                <MenuItem value="Software">Software</MenuItem>
                                <MenuItem value="Network">Network</MenuItem>
                                <MenuItem value="Access">Access</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Organization</InputLabel>
                            <Select
                                value={filters.company}
                                label="Organization"
                                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                            >
                                <MenuItem value="all">All Organizations</MenuItem>
                                {COMPANIES.map(company => (
                                    <MenuItem key={company.id} value={company.id}>
                                        {formatCompanyLabel(company)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="From Date"
                            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : null })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="To Date"
                            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : null })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Results Summary */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                {filteredTickets.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Results
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                                {filteredTickets.filter(t => t.status === 'Open').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Open Tickets
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                {filteredTickets.filter(t => t.priority === 'High').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                High Priority
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                                {filteredTickets.filter(t => t.status === 'Resolved').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Resolved
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Results Table */}
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>Ticket Details</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Organization</TableCell>
                            <TableCell>Requester</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTickets.map((ticket) => (
                            <TableRow key={ticket._id || ticket.id} hover>
                                <TableCell>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            {ticket._id || ticket.id}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {ticket.title}
                                        </Typography>
                                        <Chip
                                            label={ticket.category}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={ticket.status}
                                        color={getStatusColor(ticket.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={ticket.priority}
                                        color={getPriorityColor(ticket.priority)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusinessIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {getTicketOrganizationLabel(ticket)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            {getRequesterName(ticket)}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ScheduleIcon fontSize="small" color="action" />
                                        <Typography variant="caption">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="View Details">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewTicket(ticket)}
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reassign">
                                        <IconButton size="small" color="primary">
                                            <AssignIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, newPage) => setPage(newPage)}
                    color="primary"
                />
            </Box>

            {/* Ticket Details Dialog */}
            <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Ticket Details - {selectedTicket?._id || selectedTicket?.id}
                </DialogTitle>
                <DialogContent>
                    {selectedTicket && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    Cross-tenant ticket view - Administrative access only
                                </Alert>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>{selectedTicket.title}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={selectedTicket.status}
                                    color={getStatusColor(selectedTicket.status)}
                                    size="small"
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>{selectedTicket.description}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {getTicketOrganizationLabel(selectedTicket)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Requester</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>{getRequesterName(selectedTicket)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>{getAssigneeName(selectedTicket)}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {new Date(selectedTicket.createdAt).toLocaleString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialog(false)}>Close</Button>
                    <Button variant="contained" startIcon={<AssignIcon />}>
                        Reassign Ticket
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GlobalTicketSearch;
