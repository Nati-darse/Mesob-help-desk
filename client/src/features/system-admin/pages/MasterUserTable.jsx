import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, Alert,
    CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    MoreVert as MoreVertIcon,
    LockReset as LockResetIcon,
    AdminPanelSettings as RoleIcon,
    Login as LoginIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById } from '../../../utils/companies';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';

const MasterUserTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Dialog States
    const [editRoleDialog, setEditRoleDialog] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [impersonating, setImpersonating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users/global');
            // Transform data for DataGrid
            const rows = res.data.map(u => ({
                id: u._id,
                ...u,
                companyName: getCompanyById(u.companyId)?.name || 'Unknown'
            }));
            setUsers(rows);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Action Menu Handlers
    const handleMenuClick = (event, user) => {
        setSelectedUser(user);
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Actions
    const handlePasswordReset = () => {
        handleMenuClose();
        alert(`Password reset link sent to ${selectedUser.email} (Mock Action)`);
    };

    const handleOpenRoleDialog = () => {
        handleMenuClose();
        setNewRole(selectedUser.role);
        setEditRoleDialog(true);
    };

    const handleSimulateUser = async () => {
        if (!window.confirm(`Login as ${selectedUser.name}?`)) return;

        setImpersonating(true);
        handleMenuClose();
        try {
            const res = await axios.post('/api/auth/impersonate', { userId: selectedUser.id });
            const { token, ...userData } = res.data;
            localStorage.setItem('mesob_token', token);
            localStorage.setItem('mesob_user', JSON.stringify(userData));
            window.location.href = '/';
        } catch (error) {
            console.error('Error:', error);
            setImpersonating(false);
            alert('Impersonation failed');
        }
    };

    const saveRole = async () => {
        try {
            await axios.put(`/api/users/${selectedUser.id}/role`, { role: newRole });
            setEditRoleDialog(false);
            fetchUsers();
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const columns = [
        { field: 'name', headerName: 'Name', width: 200, fontWeight: 'bold' },
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'role',
            headerName: 'Role',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value.includes('Admin') ? 'warning' : 'default'}
                />
            )
        },
        { field: 'companyName', headerName: 'Organization', flex: 1, minWidth: 250 },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: () => <Chip label="Active" color="success" size="small" variant="outlined" />
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 80,
            sortable: false,
            renderCell: (params) => (
                <IconButton size="small" onClick={(e) => handleMenuClick(e, params.row)}>
                    <MoreVertIcon />
                </IconButton>
            ),
        },
    ];

    return (
        <Box maxWidth="1600px" margin="0 auto">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#0A1929' }}>
                Master User List
            </Typography>

            <Paper sx={{ height: 750, width: '100%' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    pageSize={10}
                    loading={loading}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableSelectionOnClick
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    sx={{ border: 0 }}
                />
            </Paper>

            {/* Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handlePasswordReset}>
                    <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Force Password Reset</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenRoleDialog}>
                    <ListItemIcon><RoleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Change Role</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSimulateUser} disabled={selectedUser?.role === 'System Admin'}>
                    <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Login As User</ListItemText>
                </MenuItem>
            </Menu>

            {/* Role Dialog */}
            <Dialog open={editRoleDialog} onClose={() => setEditRoleDialog(false)}>
                <DialogTitle>Change Role: {selectedUser?.name}</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Proceed with caution.
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
                    <Button variant="contained" onClick={saveRole}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MasterUserTable;
