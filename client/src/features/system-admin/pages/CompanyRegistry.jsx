import React, { useState } from 'react';
import { Box, Typography, Chip, IconButton, TextField, InputAdornment, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search as SearchIcon, Edit as EditIcon, Circle as CircleIcon, Add as AddIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
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
        <Box maxWidth="1600px" margin="0 auto">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                    Company Registry
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Onboard Company
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
