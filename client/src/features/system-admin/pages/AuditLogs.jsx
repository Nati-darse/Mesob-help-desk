import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Chip, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, IconButton } from '@mui/material';
import {
    History as HistoryIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import axios from 'axios';

const AuditLogs = () => {
    const [filterType, setFilterType] = useState('All');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/audit-logs?limit=200');
                setLogs(res.data || []);
            } catch (e) {
                setError('Failed to load audit logs');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const getType = (action) => {
        if (!action) return 'info';
        if (action.includes('DELETE') || action.includes('RESET') || action.includes('ROTATE')) return 'warning';
        if (action.includes('PASSWORD') || action.includes('ROLE') || action.includes('IMPERSONATE')) return 'error';
        if (action.includes('BACKUP')) return 'success';
        return 'info';
    };

    const getActionLabel = (action) => {
        if (!action) return 'Action';
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
    };

    const filteredLogs = useMemo(() => {
        if (filterType === 'All') return logs;
        if (filterType === 'Security') {
            return logs.filter(l => String(l.action || '').includes('PASSWORD') || String(l.action || '').includes('ROLE') || String(l.action || '').includes('IMPERSONATE'));
        }
        if (filterType === 'System') {
            return logs.filter(l => String(l.action || '').includes('SETTINGS') || String(l.action || '').includes('BACKUP') || String(l.action || '').includes('MAINTENANCE') || String(l.action || '').includes('SMTP'));
        }
        if (filterType === 'User') {
            return logs.filter(l => String(l.action || '').includes('USER') || String(l.action || '').includes('LOGIN'));
        }
        return logs;
    }, [logs, filterType]);

    const getIcon = (type) => {
        switch (type) {
            case 'error': return <SecurityIcon color="error" />;
            case 'warning': return <DeleteIcon color="warning" />;
            case 'success': return <HistoryIcon color="success" />;
            default: return <EditIcon color="action" />;
        }
    };

    return (
        <Box maxWidth="1200px" margin="0 auto" sx={{ px: { xs: 2, sm: 0 } }}>
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    Audit Logs
                </Typography>
                <TextField
                    select
                    size="small"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 200 }, bgcolor: 'background.paper' }}
                    InputProps={{
                        startAdornment: <FilterIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                >
                    <MenuItem value="All">All Events</MenuItem>
                    <MenuItem value="Security">Security</MenuItem>
                    <MenuItem value="System">System</MenuItem>
                    <MenuItem value="User">User Actions</MenuItem>
                </TextField>
            </Box>

            <Paper>
                <List>
                    {loading && (
                        <ListItem>
                            <ListItemText primary="Loading audit logs..." />
                        </ListItem>
                    )}
                    {!loading && error && (
                        <ListItem>
                            <ListItemText primary={error} />
                        </ListItem>
                    )}
                    {!loading && !error && filteredLogs.map((log, index) => {
                        const type = getType(log.action);
                        const performedBy = log.performedBy?.name || log.performedBy?.email || 'System';
                        const target = log.targetUser?.name || log.targetUser?.email || log.metadata?.ticketId || log.metadata?.path || 'System';
                        return (
                            <React.Fragment key={log._id || `${log.action}-${index}`}>
                                <ListItem alignItems="flex-start" sx={{ py: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: (theme) => type === 'error' ? (theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.2)' : '#ffebee') : (theme.palette.mode === 'dark' ? 'rgba(30,79,177,0.2)' : '#e3f2fd') }}>
                                            {getIcon(type)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {performedBy}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {getActionLabel(log.action)}
                                                </Typography>
                                                <Chip
                                                    label={target}
                                                    size="small"
                                                    variant="outlined"
                                                    color={type === 'error' ? 'error' : 'default'}
                                                    sx={{ height: 20 }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                                {index < filteredLogs.length - 1 && <Divider variant="inset" component="li" />}
                            </React.Fragment>
                        );
                    })}
                </List>
            </Paper>
        </Box>
    );
};

export default AuditLogs;
