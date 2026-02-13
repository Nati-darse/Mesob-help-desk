import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Button, Chip, Select, MenuItem, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    DeleteForever as DeleteIcon,
    AdminPanelSettings as AdminIcon,
    LockReset as ResetIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById, formatCompanyLabel } from '../../../utils/companies';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';

const GlobalUserEditor = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyFilter, setCompanyFilter] = useState('all');
    const [editRoleDialog, setEditRoleDialog] = useState(false);
    const [registerDialog, setRegisterDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [regFormData, setRegFormData] = useState({
        name: '',
        email: '',
        role: ROLES.EMPLOYEE,
        companyId: 1
    });
    const editableRoles = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.TECHNICIAN, ROLES.EMPLOYEE];

    // Auto-assign to Digitalization Bureau if IT role is selected
    const handleRoleChange = (role) => {
        const isITRole = role === ROLES.ADMIN || role === ROLES.TECHNICIAN;
        setRegFormData({ 
            ...regFormData, 
            role, 
            companyId: isITRole ? 19 : regFormData.companyId // Assuming Digitalization Bureau has ID 19
        });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRegisterUser = async () => {
        try {
            await axios.post('/api/auth/register-user', regFormData);
            setRegisterDialog(false);
            setRegFormData({ name: '', email: '', role: ROLES.EMPLOYEE, companyId: 1 });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    useEffect(() => {
        const visibleUsers = users.filter(u => u.role !== ROLES.SYSTEM_ADMIN);
        if (companyFilter === 'all') {
            setFilteredUsers(visibleUsers);
        } else {
            setFilteredUsers(visibleUsers.filter(u => u.companyId === parseInt(companyFilter)));
        }
    }, [companyFilter, users]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users/global');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditRole = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setEditRoleDialog(true);
    };

    const saveRole = async () => {
        try {
            await axios.put(`/api/users/${selectedUser._id}/role`, { role: newRole });
            setEditRoleDialog(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Delete ${user.name}? This action cannot be undone.`)) return;
        setDeletingUserId(user._id);
        try {
            await axios.delete(`/api/users/${user._id}`);
            setUsers(prev => prev.filter(u => u._id !== user._id));
            setFilteredUsers(prev => prev.filter(u => u._id !== user._id));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        } finally {
            setDeletingUserId(null);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Global User Directory
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => setRegisterDialog(true)}
                        startIcon={<AdminIcon />}
                    >
                        Register New User
                    </Button>
                    <FormControl sx={{ minWidth: 250 }} size="small">
                        <InputLabel>Filter by Organization</InputLabel>
                        <Select
                            value={companyFilter}
                            label="Filter by Organization"
                            onChange={(e) => setCompanyFilter(e.target.value)}
                        >
                            <MenuItem value="all"><em>Show All Organizations</em></MenuItem>
                            {COMPANIES.map(comp => (
                                <MenuItem key={comp.id} value={comp.id}>
                                    {formatCompanyLabel(comp)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Organization</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => {
                            const company = getCompanyById(user.companyId);
                            return (
                                <TableRow key={user._id}>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ROLE_LABELS[user.role] || user.role}
                                            size="small"
                                            color={user.role === 'System Admin' || user.role === 'Admin' ? 'warning' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={formatCompanyLabel(company)}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    maxWidth: 260,
                                                    '& .MuiChip-label': {
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleEditRole(user)}
                                            sx={{ mr: 1 }}
                                        >
                                            Role
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={deletingUserId === user._id ? <CircularProgress size={16} /> : <DeleteIcon />}
                                            onClick={() => handleDeleteUser(user)}
                                            disabled={deletingUserId === user._id || user.role === 'System Admin'}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            size="small"
                                            color="info"
                                            startIcon={<ResetIcon />}
                                            onClick={async () => {
                                                try {
                                                    await axios.post(`/api/users/${user._id}/reset-password`);
                                                    alert(`Temporary password sent to ${user.email}`);
                                                } catch (error) {
                                                    alert('Failed to reset password');
                                                }
                                            }}
                                            sx={{ ml: 1 }}
                                        >
                                            Reset
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Role Dialog */}
            <Dialog open={editRoleDialog} onClose={() => setEditRoleDialog(false)}>
                <DialogTitle>Overwrite {selectedUser?.name}'s Role</DialogTitle>
                <DialogContent sx={{ minWidth: { xs: 'auto', sm: 300 }, pt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Changing a user's role will immediately affect their permissions.
                    </Alert>
                    <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={newRole}
                            label="Role"
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            {editableRoles.map((value) => (
                                <MenuItem key={value} value={value}>{ROLE_LABELS[value] || value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditRoleDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={saveRole}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Registration Dialog */}
            <Dialog open={registerDialog} onClose={() => setRegisterDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Register New Administrative/Staff User</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Users created here will have a default password of <b>Mesob@123</b>.
                    </Alert>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth label="Full Name"
                            value={regFormData.name}
                            onChange={(e) => setRegFormData({ ...regFormData, name: e.target.value })}
                        />
                        <TextField
                            fullWidth label="Email Address"
                            value={regFormData.email}
                            onChange={(e) => setRegFormData({ ...regFormData, email: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={regFormData.role}
                                label="Role"
                                onChange={(e) => handleRoleChange(e.target.value)}
                            >
                                <MenuItem value={ROLES.ADMIN}>Administrator</MenuItem>
                                <MenuItem value={ROLES.TECHNICIAN}>IT Technician</MenuItem>
                                <MenuItem value={ROLES.TEAM_LEAD}>Team Lead</MenuItem>
                                <MenuItem value={ROLES.EMPLOYEE}>Employee</MenuItem>
                            </Select>
                        </FormControl>
                        {regFormData.role === ROLES.ADMIN || regFormData.role === ROLES.TECHNICIAN ? (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                IT roles are automatically assigned to Digitalization Bureau
                            </Alert>
                        ) : null}
                        <FormControl fullWidth>
                            <InputLabel>Organization / Company</InputLabel>
                            <Select
                                value={regFormData.companyId}
                                label="Organization / Company"
                                onChange={(e) => setRegFormData({ ...regFormData, companyId: e.target.value })}
                                disabled={regFormData.role === ROLES.ADMIN || regFormData.role === ROLES.TECHNICIAN}
                            >
                                {COMPANIES.map(c => <MenuItem key={c.id} value={c.id}>{formatCompanyLabel(c)}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRegisterDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleRegisterUser}
                        disabled={!regFormData.name || !regFormData.email}
                    >
                        Create User
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GlobalUserEditor;
