import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, Alert,
    CircularProgress, TextField, InputAdornment, Tooltip, Badge
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    MoreVert as MoreVertIcon,
    Lock as LockResetIcon,
    Security as RoleIcon,
    Login as LoginIcon,
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    Block as BlockIcon,
    Security as SecurityIcon,
    History as HistoryIcon,
    Place as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById } from '../../../utils/companies';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';

const MasterUserTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Dialog States
    const [editRoleDialog, setEditRoleDialog] = useState(false);
    const [userDetailsDialog, setUserDetailsDialog] = useState(false);
    const [forceLogoutDialog, setForceLogoutDialog] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [impersonating, setImpersonating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/system-admin/users/stealth-audit');
            // Transform data for DataGrid
            const rows = res.data.map(u => ({
                id: u.id,
                ...u,
                companyName: getCompanyById(u.companyId)?.name || 'Unknown',
                lastLoginDisplay: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never',
                isOnlineDisplay: u.isOnline ? 'Online' : 'Offline'
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

    const handleOpenUserDetails = () => {
        handleMenuClose();
        setUserDetailsDialog(true);
    };

    const handleOpenForceLogout = () => {
        handleMenuClose();
        setForceLogoutDialog(true);
    };

    const handleSimulateUser = async () => {
        if (!window.confirm(`Login as ${selectedUser.name}? This action will be logged.`)) return;

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

    const handleForceLogout = async () => {
        try {
            await axios.post('/api/system-admin/force-logout', { 
                type: 'user', 
                targetId: selectedUser.id 
            });
            setForceLogoutDialog(false);
            fetchUsers(); // Refresh data
            alert('User session terminated successfully');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to terminate session');
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

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
        user.role.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        { 
            field: 'name', 
            headerName: 'Name', 
            width: 180, 
            fontWeight: 'bold',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {params.row.isHidden && (
                        <Tooltip title="Hidden System Admin">
                            <VisibilityIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        </Tooltip>
                    )}
                    <Typography variant="body2" fontWeight="bold">
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        { field: 'email', headerName: 'Email', width: 220 },
        {
            field: 'role',
            headerName: 'Role',
            width: 140,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value.includes('Admin') ? 'warning' : 'default'}
                    variant={params.row.isHidden ? 'filled' : 'outlined'}
                />
            )
        },
        { field: 'companyName', headerName: 'Organization', flex: 1, minWidth: 200 },
        {
            field: 'isOnlineDisplay',
            headerName: 'Status',
            width: 100,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'Online' ? 'success' : 'default'}
                    variant="outlined"
                />
            )
        },
        {
            field: 'lastLoginDisplay',
            headerName: 'Last Login',
            width: 160,
            renderCell: (params) => (
                <Box>
                    <Typography variant="caption" display="block">
                        {params.value}
                    </Typography>
                    {params.row.lastLoginIP && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            <LocationIcon sx={{ fontSize: 12, mr: 0.5 }} />
                            {params.row.lastLoginIP}
                        </Typography>
                    )}
                </Box>
            )
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
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                        🕵️ Stealth User Audit
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Complete user oversight across all {COMPANIES.length} organizations • {users.length} total users
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        startIcon={<SecurityIcon />}
                        onClick={() => setForceLogoutDialog(true)}
                        color="error"
                    >
                        Emergency Logout All
                    </Button>
                </Box>
            </Box>

            {/* Search Bar */}
            <Paper sx={{ mb: 3, p: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search users by name, email, organization, or role..."
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

            <Paper sx={{ height: 750, width: '100%' }}>
                <DataGrid
                    rows={filteredUsers}
                    columns={columns}
                    pageSize={25}
                    loading={loading}
                    rowsPerPageOptions={[25, 50, 100]}
                    disableSelectionOnClick
                    initialState={{
                        pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    sx={{ 
                        border: 0,
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                />
            </Paper>

            {/* Enhanced Context Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleOpenUserDetails}>
                    <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>View Login History</ListItemText>
                </MenuItem>
                <MenuItem onClick={handlePasswordReset}>
                    <ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Force Password Reset</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenRoleDialog}>
                    <ListItemIcon><RoleIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Change Role</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleOpenForceLogout} disabled={!selectedUser?.isOnline}>
                    <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Terminate Session</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSimulateUser} disabled={selectedUser?.role === 'System Admin'}>
                    <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Impersonate User</ListItemText>
                </MenuItem>
            </Menu>

            {/* User Details Dialog */}
            <Dialog open={userDetailsDialog} onClose={() => setUserDetailsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    User Audit Details: {selectedUser?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Login History</Typography>
                            {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 ? (
                                selectedUser.loginHistory.map((login, index) => (
                                    <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                                        <Typography variant="body2">
                                            <strong>Time:</strong> {new Date(login.loginAt).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>IP:</strong> {login.ipAddress}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>User Agent:</strong> {login.userAgent}
                                        </Typography>
                                        <Chip 
                                            label={login.success ? 'Success' : 'Failed'} 
                                            size="small" 
                                            color={login.success ? 'success' : 'error'}
                                            sx={{ mt: 1 }}
                                        />
                                    </Paper>
                                ))
                            ) : (
                                <Typography color="text.secondary">No login history available</Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUserDetailsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Role Dialog */}
            <Dialog open={editRoleDialog} onClose={() => setEditRoleDialog(false)}>
                <DialogTitle>Change Role: {selectedUser?.name}</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Role changes are logged and audited.
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

            {/* Force Logout Dialog */}
            <Dialog open={forceLogoutDialog} onClose={() => setForceLogoutDialog(false)}>
                <DialogTitle>Force Logout Confirmation</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        This will immediately terminate the user's session. This action is logged.
                    </Alert>
                    <Typography>
                        Are you sure you want to force logout {selectedUser?.name}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForceLogoutDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleForceLogout}>
                        Force Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MasterUserTable;
