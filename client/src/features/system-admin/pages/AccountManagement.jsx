import { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Button, Chip, Select, MenuItem, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
    CircularProgress, IconButton, Tooltip
} from '@mui/material';
import {
    Block as BlockIcon,
    CheckCircle as ActivateIcon,
    Delete as DeleteIcon,
    Security as SecurityIcon,
    VpnKey as KeyIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import { COMPANIES, getCompanyById } from '../../../utils/companies';

const AccountManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyFilter, setCompanyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionDialog, setActionDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionType, setActionType] = useState('');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

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

    const filteredUsers = users.filter(user => {
        const companyMatch = companyFilter === 'all' || user.companyId === parseInt(companyFilter);
        const statusMatch = statusFilter === 'all' || 
            (statusFilter === 'active' && user.isActive !== false) ||
            (statusFilter === 'suspended' && user.isActive === false);
        return companyMatch && statusMatch;
    });

    const handleAccountAction = (user, action) => {
        setSelectedUser(user);
        setActionType(action);
        setActionDialog(true);
        setReason('');
    };

    const executeAction = async () => {
        if (!reason.trim() && actionType !== 'activate') {
            alert('Please provide a reason for this action');
            return;
        }

        setProcessing(true);
        try {
            await axios.post(`/api/users/${selectedUser._id}/account-action`, {
                action: actionType,
                reason: reason
            });
            
            setActionDialog(false);
            fetchUsers();
            alert(`Account ${actionType} successful`);
        } catch (error) {
            console.error('Error executing action:', error);
            alert('Action failed');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusChip = (user) => {
        if (user.isActive === false) {
            return <Chip label="Suspended" color="error" size="small" />;
        }
        if (user.lastLogin && new Date() - new Date(user.lastLogin) > 30 * 24 * 60 * 60 * 1000) {
            return <Chip label="Inactive" color="warning" size="small" />;
        }
        return <Chip label="Active" color="success" size="small" />;
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Account Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="suspended">Suspended</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Organization</InputLabel>
                        <Select
                            value={companyFilter}
                            label="Organization"
                            onChange={(e) => setCompanyFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Organizations</MenuItem>
                            {COMPANIES.map(comp => (
                                <MenuItem key={comp.id} value={comp.id}>
                                    {comp.initials} - {comp.name.substring(0, 25)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Security Notice</Typography>
                Account actions are logged and monitored. Use administrative privileges responsibly.
            </Alert>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        <TableRow>
                            <TableCell>User Details</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Organization</TableCell>
                            <TableCell>Last Activity</TableCell>
                            <TableCell align="right">Account Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => {
                            const company = getCompanyById(user.companyId);
                            const isSystemAdmin = user.role === 'System Admin';
                            
                            return (
                                <TableRow key={user._id}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {user.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip label={user.role} size="small" variant="outlined" />
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(user)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={company.initials} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {user.lastLogin ? 
                                                new Date(user.lastLogin).toLocaleDateString() : 
                                                'Never'
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {user.isActive !== false ? (
                                                <Tooltip title="Suspend Account">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleAccountAction(user, 'suspend')}
                                                        disabled={isSystemAdmin}
                                                    >
                                                        <BlockIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Activate Account">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleAccountAction(user, 'activate')}
                                                    >
                                                        <ActivateIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            
                                            <Tooltip title="Reset Password">
                                                <IconButton
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => handleAccountAction(user, 'reset-password')}
                                                    disabled={isSystemAdmin}
                                                >
                                                    <KeyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            <Tooltip title="View History">
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => handleAccountAction(user, 'history')}
                                                >
                                                    <HistoryIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            {!isSystemAdmin && (
                                                <Tooltip title="Delete Account">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleAccountAction(user, 'delete')}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Action Confirmation Dialog */}
            <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color="warning" />
                    Confirm Account Action
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        You are about to <strong>{actionType}</strong> the account for <strong>{selectedUser?.name}</strong>.
                        This action will be logged in the audit trail.
                    </Alert>
                    
                    {actionType !== 'activate' && actionType !== 'history' && (
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Reason for Action"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Provide a detailed reason for this administrative action..."
                            sx={{ mt: 2 }}
                        />
                    )}
                    
                    {actionType === 'delete' && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            <strong>Warning:</strong> Account deletion is permanent and cannot be undone.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={actionType === 'delete' ? 'error' : 'primary'}
                        onClick={executeAction}
                        disabled={processing || (!reason.trim() && actionType !== 'activate' && actionType !== 'history')}
                        startIcon={processing ? <CircularProgress size={16} /> : null}
                    >
                        {processing ? 'Processing...' : `Confirm ${actionType}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccountManagement;
