import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Chip, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, IconButton } from '@mui/material';
import {
    History as HistoryIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';

const MOCK_LOGS = [
    { id: 1, user: 'SysAdmin', action: 'Login', target: 'System', time: '2 mins ago', type: 'info' },
    { id: 2, user: 'SuperAdmin', action: 'Deleted Ticket', target: 'T-10293', time: '15 mins ago', type: 'warning' },
    { id: 3, user: 'Tech_Ermias', action: 'Updated Status', target: 'T-10292', time: '45 mins ago', type: 'info' },
    { id: 4, user: 'SysAdmin', action: 'Changed Role', target: 'User: Abebe', time: '1 hour ago', type: 'error' },
    { id: 5, user: 'System', action: 'Backup Complete', target: 'Database', time: '2 hours ago', type: 'success' },
    { id: 6, user: 'Unknown', action: 'Failed Login', target: 'IP: 192.168.1.55', time: '3 hours ago', type: 'error' },
    { id: 7, user: 'Manager_Sarah', action: 'Exported Report', target: 'Weekly Stats', time: '5 hours ago', type: 'info' },
];

const AuditLogs = () => {
    const [filterType, setFilterType] = useState('All');

    const getIcon = (type) => {
        switch (type) {
            case 'error': return <SecurityIcon color="error" />;
            case 'warning': return <DeleteIcon color="warning" />;
            case 'success': return <HistoryIcon color="success" />;
            default: return <EditIcon color="action" />;
        }
    };

    return (
        <Box maxWidth="1200px" margin="0 auto">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                    Audit Logs
                </Typography>
                <TextField
                    select
                    size="small"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{ width: 200, bgcolor: 'white' }}
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
                    {MOCK_LOGS.map((log, index) => (
                        <React.Fragment key={log.id}>
                            <ListItem alignItems="flex-start" sx={{ py: 2, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: log.type === 'error' ? '#ffebee' : '#e3f2fd' }}>
                                        {getIcon(log.type)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {log.user}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {log.action}
                                            </Typography>
                                            <Chip
                                                label={log.target}
                                                size="small"
                                                variant="outlined"
                                                color={log.type === 'error' ? 'error' : 'default'}
                                                sx={{ height: 20 }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {log.time} • ID: {`LOG-${1000 + log.id}`}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            {index < MOCK_LOGS.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default AuditLogs;
