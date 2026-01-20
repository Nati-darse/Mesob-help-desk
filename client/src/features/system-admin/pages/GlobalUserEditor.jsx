import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Button, Chip, Select, MenuItem, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    Login as LoginIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById } from '../../../utils/companies';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';

const GlobalUserEditor = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyFilter, setCompanyFilter] = useState('all');
    const [editRoleDialog, setEditRoleDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [impersonating, setImpersonating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (companyFilter === 'all') {
            setFilteredUsers(users);
        } else {
            setFilteredUsers(users.filter(u => u.companyId === parseInt(companyFilter)));
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

    const handleSimulateUser = async (user) => {
        if (!window.confirm(`Are you sure you want to impersonate ${user.name}? You will be logged in as them.`)) return;

        setImpersonating(true);
        try {
            const res = await axios.post('/api/auth/impersonate', { userId: user._id });
            const { token, ...userData } = res.data;

            // Save to local storage (replacing current admin session)
            localStorage.setItem('mesob_token', token);
            localStorage.setItem('mesob_user', JSON.stringify(userData));

            // Hard reload to refresh context
            window.location.href = '/';
        } catch (error) {
            console.error('Error impersonating:', error);
            setImpersonating(false);
            alert('Impersonation failed');
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Global User Directory
                </Typography>
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
                                {comp.initials} - {comp.name.substring(0, 30)}{comp.name.length > 30 ? '...' : ''}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Table>
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
                                            label={user.role}
                                            size="small"
                                            color={user.role === 'System Admin' || user.role === 'Admin' ? 'warning' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label={company.initials} size="small" variant="outlined" />
                                            <Typography variant="body2">{user.department}</Typography>
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
                                            color="warning"
                                            startIcon={impersonating ? <CircularProgress size={16} /> : <LoginIcon />}
                                            onClick={() => handleSimulateUser(user)}
                                            disabled={impersonating || user.role === 'System Admin'}
                                        >
                                            Simulate
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
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
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
                            {Object.entries(ROLES).map(([key, value]) => (
                                <MenuItem key={key} value={value}>{value}</MenuItem>
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
        </Box>
    );
};

export default GlobalUserEditor;
