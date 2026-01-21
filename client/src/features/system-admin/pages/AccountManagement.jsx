import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent,
    Chip, IconButton, Menu, ListItemIcon, ListItemText, Alert, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Person as PersonIcon,
    SupervisorAccount as SuperAdminIcon,
    Build as TechnicianIcon,
    Group as TeamLeadIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES } from '../../../utils/companies';

const AccountManagement = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createDialog, setCreateDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        companyId: 1
    });

    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get('/api/system-admin/privileged-accounts');
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            showSnackbar('Failed to fetch accounts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        if (!formData.email.includes('@')) errors.email = 'Valid email is required';
        if (!createDialog && !formData.password.trim()) errors.password = 'Password is required';
        if (createDialog && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (!formData.role) errors.role = 'Role is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateAccount = async () => {
        if (!validateForm()) return;

        try {
            await axios.post('/api/system-admin/create-account', formData);
            setCreateDialog(false);
            resetForm();
            fetchAccounts();
            showSnackbar(`${formData.role} account created successfully!`);
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to create account', 'error');
        }
    };

    const handleUpdateAccount = async () => {
        if (!validateForm()) return;

        try {
            const updateData = { 
                name: formData.name,
                email: formData.email,
                companyId: formData.companyId
            };
            
            await axios.put(`/api/system-admin/privileged-accounts/${selectedAccount._id}`, updateData);
            setEditDialog(false);
            resetForm();
            fetchAccounts();
            showSnackbar('Account updated successfully!');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to update account', 'error');
        }
    };

    const handleDeleteAccount = async (account) => {
        if (!window.confirm(`Are you sure you want to delete ${account.name}'s account? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`/api/system-admin/privileged-accounts/${account._id}`);
            fetchAccounts();
            showSnackbar('Account deleted successfully!');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to delete account', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            companyId: 1
        });
        setFormErrors({});
        setSelectedAccount(null);
    };

    const openEditDialog = (account) => {
        setSelectedAccount(account);
        setFormData({
            name: account.name,
            email: account.email,
            password: '',
            role: account.role,
            companyId: account.companyId
        });
        setEditDialog(true);
        setAnchorEl(null);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Super Admin': return <SuperAdminIcon color="error" />;
            case 'Technician': return <TechnicianIcon color="primary" />;
            case 'Team Lead': return <TeamLeadIcon color="warning" />;
            default: return <PersonIcon />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Super Admin': return 'error';
            case 'Technician': return 'primary';
            case 'Team Lead': return 'warning';
            default: return 'default';
        }
    };

    const companies = COMPANIES;

    return (
        <Box maxWidth="1400px" margin="0 auto">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                        👥 Privileged Account Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create and manage Super Admin, Technician, and Team Lead accounts
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialog(true)}
                    size="large"
                    sx={{ px: 3 }}
                >
                    Create Account
                </Button>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {['Super Admin', 'Technician', 'Team Lead'].map((role) => {
                    const count = accounts.filter(acc => acc.role === role).length;
                    return (
                        <Grid item xs={12} md={4} key={role}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: `${getRoleColor(role)}.light` }}>
                                            {getRoleIcon(role)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h4" fontWeight="bold">
                                                {count}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {role}{count !== 1 ? 's' : ''}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Accounts Table */}
            <Paper>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight="bold">
                        All Privileged Accounts ({accounts.length})
                    </Typography>
                </Box>
                
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Organization</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {accounts.map((account) => (
                                <TableRow key={account._id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: `${getRoleColor(account.role)}.light` }}>
                                                {getRoleIcon(account.role)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {account.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {account.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={account.role}
                                            color={getRoleColor(account.role)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{account.department}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {account.companyDisplayName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {account.companyId}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={account.isAvailable ? 'Active' : 'Inactive'}
                                            color={account.isAvailable ? 'success' : 'default'}
                                            size="small"
                                        />
                                        {account.role === 'Technician' && account.dutyStatus && (
                                            <Chip
                                                label={account.dutyStatus}
                                                size="small"
                                                variant="outlined"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {new Date(account.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setSelectedAccount(account);
                                                setAnchorEl(e.currentTarget);
                                            }}
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {accounts.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Privileged Accounts Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create your first Super Admin, Technician, or Team Lead account to get started.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => openEditDialog(selectedAccount)}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit Account</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={() => {
                        handleDeleteAccount(selectedAccount);
                        setAnchorEl(null);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Delete Account</ListItemText>
                </MenuItem>
            </Menu>

            {/* Create Account Dialog */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SecurityIcon color="primary" />
                        Create Privileged Account
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Creating privileged accounts with elevated permissions. All actions are logged and audited.
                        Departments are automatically assigned based on role.
                    </Alert>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                error={!!formErrors.password}
                                helperText={formErrors.password || 'Minimum 6 characters'}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth margin="normal" error={!!formErrors.role}>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Role"
                                    onChange={(e) => {
                                        const newRole = e.target.value;
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            role: newRole,
                                            // Auto-set company based on role
                                            companyId: newRole === 'Technician' || newRole === 'Super Admin' ? 1 : prev.companyId
                                        }));
                                    }}
                                >
                                    <MenuItem value="Super Admin">Super Admin</MenuItem>
                                    <MenuItem value="Technician">Technician</MenuItem>
                                    <MenuItem value="Team Lead">Team Lead</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl 
                                fullWidth 
                                margin="normal" 
                                disabled={formData.role !== 'Team Lead'}
                            >
                                <InputLabel>Organization</InputLabel>
                                <Select
                                    value={formData.companyId}
                                    label="Organization"
                                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                                >
                                    {companies.map((company) => (
                                        <MenuItem key={company.id} value={company.id}>
                                            {company.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {formData.role === 'Technician' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Technicians are automatically assigned to MESOB IT Support Team
                                </Typography>
                            )}
                            {formData.role === 'Super Admin' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Super Admins are automatically assigned to MESOB IT Support Team
                                </Typography>
                            )}
                            {formData.role === 'Team Lead' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Select the organization this Team Lead will manage
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateAccount}>
                        Create Account
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EditIcon color="primary" />
                        Edit Account: {selectedAccount?.name}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Departments are automatically managed based on role and cannot be changed.
                    </Alert>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl 
                                fullWidth 
                                margin="normal" 
                                disabled={formData.role !== 'Team Lead'}
                            >
                                <InputLabel>Organization</InputLabel>
                                <Select
                                    value={formData.companyId}
                                    label="Organization"
                                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                                >
                                    {companies.map((company) => (
                                        <MenuItem key={company.id} value={company.id}>
                                            {company.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {formData.role === 'Technician' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Technicians must remain in MESOB IT Support Team
                                </Typography>
                            )}
                            {formData.role === 'Super Admin' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Super Admins must remain in MESOB IT Support Team
                                </Typography>
                            )}
                            {formData.role === 'Team Lead' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Select the organization this Team Lead will manage
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateAccount}>
                        Update Account
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    severity={snackbar.severity} 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AccountManagement;