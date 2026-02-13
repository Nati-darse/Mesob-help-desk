import { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Button, Chip, Select, MenuItem, FormControl, InputLabel,
    TextField, Grid, Card, CardContent, IconButton, Tooltip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, Pagination,
    InputAdornment, Menu, ListItemIcon, ListItemText
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as ActivateIcon,
    Download as ExportIcon,
    MoreVert as MoreIcon,
    Visibility as ViewIcon,
    Security as SecurityIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById, formatCompanyLabel } from '../../../utils/companies';
import { ROLES, ROLE_LABELS } from '../../../constants/roles';

const MasterUserTable = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        role: 'all',
        company: 'all',
        status: 'all',
        lastLogin: 'all'
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionDialog, setActionDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const itemsPerPage = 15;
    const roleOptions = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEAD, ROLES.TECHNICIAN, ROLES.EMPLOYEE];

    // Real user data fetch
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/users/global');
            const visibleUsers = res.data.filter((u) => u.role !== ROLES.SYSTEM_ADMIN);
            setUsers(visibleUsers);
            setFilteredUsers(visibleUsers);
            setTotalPages(Math.ceil(visibleUsers.length / itemsPerPage));
        } catch (error) {
            console.error('Error fetching global users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        applyFilters();
    }, [searchQuery, filters, users]);

    const applyFilters = () => {
        let filtered = users.filter(user => {
            const matchesSearch = !searchQuery ||
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = filters.role === 'all' || user.role === filters.role;
            const matchesCompany = filters.company === 'all' || user.companyId === parseInt(filters.company);
            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'active' && user.isActive) ||
                (filters.status === 'inactive' && !user.isActive);

            const daysSinceLogin = user.lastLogin ?
                (new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24) : 999;
            const matchesLastLogin = filters.lastLogin === 'all' ||
                (filters.lastLogin === 'recent' && daysSinceLogin <= 7) ||
                (filters.lastLogin === 'week' && daysSinceLogin <= 30) ||
                (filters.lastLogin === 'month' && daysSinceLogin <= 90) ||
                (filters.lastLogin === 'old' && daysSinceLogin > 90);

            return matchesSearch && matchesRole && matchesCompany && matchesStatus && matchesLastLogin;
        });

        setFilteredUsers(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setPage(1);
    };

    const handleAction = (user, action) => {
        setSelectedUser(user);
        setActionType(action);
        setActionDialog(true);
        setAnchorEl(null);
    };

    const executeAction = async () => {
        // Simulate API call
        console.log(`Executing ${actionType} on user:`, selectedUser);
        setActionDialog(false);
        // Refresh data
    };

    const handleExport = () => {
        const csvContent = [
            ['Name', 'Email', 'Role', 'Organization', 'Status', 'Last Login', 'Login Count', 'Tickets Created'].join(','),
            ...filteredUsers.map(user => {
                const company = getCompanyById(user.companyId);
                return [
                    `"${user.name}"`,
                    user.email,
                    ROLE_LABELS[user.role] || user.role,
                    `"${formatCompanyLabel(company)}"`,
                    user.isActive ? 'Active' : 'Inactive',
                    user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
                    user.loginCount,
                    user.ticketsCreated
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `master-user-table-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getStatusChip = (user) => {
        if (!user.isActive) {
            return <Chip label="Suspended" color="error" size="small" />;
        }

        const daysSinceLogin = user.lastLogin ?
            (new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24) : 999;

        if (daysSinceLogin > 90) {
            return <Chip label="Dormant" color="warning" size="small" />;
        } else if (daysSinceLogin > 30) {
            return <Chip label="Inactive" color="info" size="small" />;
        } else {
            return <Chip label="Active" color="success" size="small" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'System Admin': return 'error';
            case 'Super Admin': return 'warning';
            case 'Admin': return 'warning';
            case 'Technician': return 'info';
            case 'Team Lead': return 'primary';
            default: return 'default';
        }
    };

    const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Master User Directory
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={handleExport}
                        disabled={filteredUsers.length === 0}
                    >
                        Export ({filteredUsers.length})
                    </Button>
                </Box>
            </Box>

            {/* Search and Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Search Users"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
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
                                {filteredUsers.length} of {users.length} users
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={filters.role}
                                label="Role"
                                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                {roleOptions.map(role => (
                                    <MenuItem key={role} value={role}>{ROLE_LABELS[role] || role}</MenuItem>
                                ))}
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
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Suspended</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Last Login</InputLabel>
                            <Select
                                value={filters.lastLogin}
                                label="Last Login"
                                onChange={(e) => setFilters({ ...filters, lastLogin: e.target.value })}
                            >
                                <MenuItem value="all">Any Time</MenuItem>
                                <MenuItem value="recent">Last 7 Days</MenuItem>
                                <MenuItem value="week">Last 30 Days</MenuItem>
                                <MenuItem value="month">Last 90 Days</MenuItem>
                                <MenuItem value="old">Over 90 Days</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                                {filteredUsers.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total Users
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                                {filteredUsers.filter(u => u.isActive).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Active Users
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                                {filteredUsers.filter(u => {
                                    const daysSinceLogin = u.lastLogin ?
                                        (new Date() - new Date(u.lastLogin)) / (1000 * 60 * 60 * 24) : 999;
                                    return daysSinceLogin > 30;
                                }).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Inactive 30+ Days
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                                {Math.round(filteredUsers.reduce((sum, u) => sum + u.loginCount, 0) / filteredUsers.length) || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Avg Logins
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Users Table */}
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Organization</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Activity</TableCell>
                            <TableCell>Last Login</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedUsers.map((user) => {
                            const company = getCompanyById(user.companyId);
                            const daysSinceLogin = user.lastLogin ?
                                Math.floor((new Date() - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24)) : null;

                            return (
                                <TableRow key={user._id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ width: 40, height: 40 }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {user.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ROLE_LABELS[user.role] || user.role}
                                            color={getRoleColor(user.role)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatCompanyLabel(company)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(user)}
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="caption" sx={{ display: 'block' }}>
                                                {user.loginCount} logins
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {user.ticketsCreated} tickets
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {user.lastLogin ? (
                                                <>
                                                    {new Date(user.lastLogin).toLocaleDateString()}
                                                    <br />
                                                    <span style={{ color: daysSinceLogin > 30 ? '#f57c00' : '#666' }}>
                                                        ({daysSinceLogin} days ago)
                                                    </span>
                                                </>
                                            ) : (
                                                'Never'
                                            )}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => setAnchorEl(e.currentTarget)}
                                        >
                                            <MoreIcon />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={() => setAnchorEl(null)}
                                        >
                                            <MenuItem onClick={() => handleAction(user, 'view')}>
                                                <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>View Profile</ListItemText>
                                            </MenuItem>
                                            <MenuItem onClick={() => handleAction(user, 'edit')}>
                                                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>Edit User</ListItemText>
                                            </MenuItem>
                                            <MenuItem onClick={() => handleAction(user, 'history')}>
                                                <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>View History</ListItemText>
                                            </MenuItem>
                                            {user.isActive ? (
                                                <MenuItem onClick={() => handleAction(user, 'suspend')}>
                                                    <ListItemIcon><BlockIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText>Suspend</ListItemText>
                                                </MenuItem>
                                            ) : (
                                                <MenuItem onClick={() => handleAction(user, 'activate')}>
                                                    <ListItemIcon><ActivateIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText>Activate</ListItemText>
                                                </MenuItem>
                                            )}
                                            {user.role !== 'System Admin' && (
                                                <MenuItem onClick={() => handleAction(user, 'delete')}>
                                                    <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText>Delete</ListItemText>
                                                </MenuItem>
                                            )}
                                        </Menu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color="warning" />
                    Confirm User Action
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        You are about to <strong>{actionType}</strong> the user <strong>{selectedUser?.name}</strong>.
                        This action will be logged in the audit trail.
                    </Alert>

                    {selectedUser && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>User:</strong> {selectedUser.name} ({selectedUser.email})
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Role:</strong> {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Organization:</strong> {formatCompanyLabel(getCompanyById(selectedUser.companyId))}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={actionType === 'delete' ? 'error' : 'primary'}
                        onClick={executeAction}
                    >
                        Confirm {actionType}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MasterUserTable;
