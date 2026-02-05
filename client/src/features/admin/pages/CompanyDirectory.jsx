import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Grid, Card, CardContent, TextField, InputAdornment,
    Chip, Avatar, Tooltip, ToggleButtonGroup, ToggleButton, CircularProgress,
    LinearProgress, IconButton, Badge, Alert, Paper, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
    Search as SearchIcon,
    Warning as WarningIcon,
    Business as BusinessIcon,
    TrendingUp as TrendingIcon,
    Speed as SpeedIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES } from '../../../utils/companies';

const CompanyDirectory = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await axios.get('/api/tickets');
                setTickets(res.data);
            } catch (error) {
                console.error('Error fetching tickets:', error);
                // Use mock data for demo
                setTickets([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const getTicketStats = (companyId) => {
        const companyTickets = tickets.filter(t => t.companyId === companyId);
        const resolved = companyTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');

        // Real Resolution Time Calculation
        let totalTime = 0;
        let ratedCount = 0;
        let totalRating = 0;

        resolved.forEach(t => {
            if (t.updatedAt && t.createdAt) {
                totalTime += (new Date(t.updatedAt) - new Date(t.createdAt)) / (1000 * 60 * 60);
            }
            if (t.rating) {
                totalRating += t.rating;
                ratedCount++;
            }
        });

        const avgResTime = resolved.length > 0 ? (totalTime / resolved.length).toFixed(1) : 0;
        const satRate = ratedCount > 0 ? Math.round((totalRating / (ratedCount * 5)) * 100) : 100;

        return {
            total: companyTickets.length,
            open: companyTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length,
            critical: companyTickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed' && t.status !== 'Resolved').length,
            resolved: resolved.length,
            avgResolutionTime: avgResTime,
            satisfactionRate: satRate
        };
    };

    const getHealthStatus = (stats) => {
        if (stats.open === 0) return { status: 'healthy', color: 'success', label: 'All Clear' };
        if (stats.critical > 0) return { status: 'critical', color: 'error', label: 'Critical' };
        if (stats.open > 5) return { status: 'warning', color: 'warning', label: 'High Load' };
        return { status: 'normal', color: 'info', label: 'Active' };
    };

    const filteredCompanies = COMPANIES.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
        const stats = getTicketStats(company.id);

        if (filter === 'all') return matchesSearch;
        if (filter === 'critical') return matchesSearch && stats.critical > 0;
        if (filter === 'high') return matchesSearch && stats.open > 10;
        if (filter === 'none') return matchesSearch && stats.open === 0;

        return matchesSearch;
    });

    const handleCompanyClick = (company) => {
        setSelectedCompany(company);
        setDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedCompany(null);
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
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Company Directory
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Monitor all 24 government bureaus and private organizations
                    </Typography>
                </Box>
                <Tooltip title="Refresh Data">
                    <IconButton onClick={() => window.location.reload()}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h2" color="primary.main" fontWeight="bold">
                            {COMPANIES.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Entities
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h2" color="success.main" fontWeight="bold">
                            {COMPANIES.filter(c => getTicketStats(c.id).open === 0).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            No Active Tickets
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h2" color="warning.main" fontWeight="bold">
                            {COMPANIES.filter(c => getTicketStats(c.id).critical > 0).length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Critical Issues
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h2" color="info.main" fontWeight="bold">
                            {tickets.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Tickets
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={(e, newFilter) => newFilter && setFilter(newFilter)}
                            sx={{ ml: { md: 'auto' }, flexWrap: 'wrap' }}
                        >
                            <ToggleButton value="all">All ({filteredCompanies.length})</ToggleButton>
                            <ToggleButton value="critical">Critical</ToggleButton>
                            <ToggleButton value="high">High Load</ToggleButton>
                            <ToggleButton value="none">Clear</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>

            {/* Companies Grid */}
            <Grid container spacing={3}>
                {filteredCompanies.map((company) => {
                    const stats = getTicketStats(company.id);
                    const health = getHealthStatus(stats);

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={company.id}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                                onClick={() => handleCompanyClick(company)}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{
                                            bgcolor: health.color + '20',
                                            color: health.color,
                                            mr: 2,
                                            width: 48,
                                            height: 48
                                        }}>
                                            <BusinessIcon />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="h6" fontWeight="bold" noWrap>
                                                {company.initials}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {company.name}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={health.label}
                                            color={health.color}
                                            size="small"
                                        />
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Active Tickets
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {stats.open}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min((stats.open / 20) * 100, 100)}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: 'grey.200'
                                            }}
                                        />
                                    </Box>

                                    <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" color="error.main" fontWeight="bold">
                                                    {stats.critical}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Critical
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h6" color="success.main" fontWeight="bold">
                                                    {stats.resolved}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Resolved
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )
                }
                )}
            </Grid>

            {/* Company Details Dialog */}
            <Dialog
                open={detailsOpen && Boolean(selectedCompany)}
                onClose={handleCloseDetails}
                maxWidth="sm"
                fullWidth
            >
                {selectedCompany && (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Typography variant="h6" fontWeight="bold">
                                {selectedCompany.name}
                            </Typography>
                            <IconButton onClick={handleCloseDetails}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                                        <Avatar sx={{
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            width: 64,
                                            height: 64,
                                            mx: 'auto',
                                            mb: 2
                                        }}>
                                            <BusinessIcon sx={{ fontSize: 32 }} />
                                        </Avatar>
                                        <Typography variant="h6" fontWeight="bold">
                                            {selectedCompany.initials}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedCompany.name}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Performance Metrics
                                        </Typography>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Tickets: {getTicketStats(selectedCompany.id).total}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Avg Resolution: {getTicketStats(selectedCompany.id).avgResolutionTime}h
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Satisfaction Rate: {getTicketStats(selectedCompany.id).satisfactionRate}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Container>
    );
};

export default CompanyDirectory;
