import React, { useState } from 'react';
import { Box, Typography, Chip, IconButton, TextField, InputAdornment, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, Card, CardContent, LinearProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search as SearchIcon, Edit as EditIcon, Circle as CircleIcon, Add as AddIcon, CloudUpload as UploadIcon, Business as BusinessIcon, TrendingUp as TrendingIcon, People as PeopleIcon } from '@mui/icons-material';
import { COMPANIES } from '../../../utils/companies';

const CompanyRegistry = () => {
    const [searchText, setSearchText] = useState('');
    const [companies, setCompanies] = useState(COMPANIES);
    const [openModal, setOpenModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    // Mock Form State
    const [formData, setFormData] = useState({
        name: '',
        initials: '',
        primaryColor: '#000000',
        maxUsers: 50,
        domain: ''
    });

    const handleOpenCreate = () => {
        setEditingCompany(null);
        setFormData({ name: '', initials: '', primaryColor: '#000000', maxUsers: 50, domain: '' });
        setOpenModal(true);
    };

    const handleOpenEdit = (company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            initials: company.initials,
            primaryColor: '#1976d2', // Mock existing value
            maxUsers: 100, // Mock existing value
            domain: `${company.initials.toLowerCase()}.gov.et` // Mock value
        });
        setOpenModal(true);
    };

    const handleSave = () => {
        alert('Company Saved (Mock Action)');
        setOpenModal(false);
    };

    // Columns
    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        {
            field: 'initials',
            headerName: 'Code',
            width: 100,
            renderCell: (params) => (
                <Chip label={params.value} variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
            )
        },
        { field: 'name', headerName: 'Organization Name', flex: 1 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: () => <Chip icon={<CircleIcon sx={{ fontSize: 10 }} />} label="Active" color="success" size="small" variant="outlined" />
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <IconButton color="primary" size="small" onClick={() => handleOpenEdit(params.row)}>
                    <EditIcon />
                </IconButton>
            ),
        },
    ];

    const filteredRows = companies.filter((row) =>
        row.name.toLowerCase().includes(searchText.toLowerCase()) ||
        row.initials.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Box maxWidth="1600px" margin="0 auto" sx={{ px: 2 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#0A1929', mb: 2 }}>
                    Organization Registry
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Manage all 19 government bureaus and their digital infrastructure
                </Typography>
                
                {/* Stats Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #1e4fb115 0%, #1e4fb105 100%)', borderLeft: '4px solid #1e4fb1' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#1e4fb1', mr: 2 }}>
                                    <BusinessIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#1e4fb1">
                                        {companies.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Organizations
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={95} sx={{ bgcolor: 'rgba(30, 79, 177, 0.1)' }} />
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #4caf5015 0%, #4caf5005 100%)', borderLeft: '4px solid #4caf50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                                    <CircleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#4caf50">
                                        {companies.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Systems
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={100} sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }} />
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #ff980015 0%, #ff980005 100%)', borderLeft: '4px solid #ff9800' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                                    <PeopleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#ff9800">
                                        2,847
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Users
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={78} sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }} />
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #0061f215 0%, #0061f205 100%)', borderLeft: '4px solid #0061f2' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ bgcolor: '#0061f2', mr: 2 }}>
                                    <TrendingIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="#0061f2">
                                        98.5%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        System Uptime
                                    </Typography>
                                </Box>
                            </Box>
                            <LinearProgress variant="determinate" value={98.5} sx={{ bgcolor: 'rgba(0, 97, 242, 0.1)' }} />
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Organization Directory
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 3, px: 3 }}>
                    Onboard New Organization
                </Button>
            </Box>

            <Paper sx={{ mb: 3, p: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search Registry..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    size="small"
                />
            </Paper>

            <Paper sx={{ height: 700, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableSelectionOnClick
                    sx={{ border: 0 }}
                />
            </Paper>

            {/* Add/Edit Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingCompany ? `Edit: ${editingCompany.name}` : 'Onboard New Organization'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <TextField
                                fullWidth label="Organization Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth label="Abbreviation / Code"
                                value={formData.initials}
                                onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth label="Dedicated Domain / Login URL"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                helperText="e.g., traffic.mesob.com"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" gutterBottom>Branding & Quotas</Typography>
                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', mb: 2 }}>
                                <Avatar sx={{ width: 64, height: 64, margin: '0 auto', bgcolor: formData.primaryColor }}>
                                    {formData.initials || 'LOGO'}
                                </Avatar>
                                <Button startIcon={<UploadIcon />} size="small" sx={{ mt: 1 }}>Upload Logo</Button>
                            </Paper>

                            <TextField
                                fullWidth label="Primary Color (Hex)"
                                value={formData.primaryColor}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                size="small"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth label="Max Users Quota"
                                type="number"
                                value={formData.maxUsers}
                                onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>
                        {editingCompany ? 'Save Changes' : 'Initialize Organization'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyRegistry;
