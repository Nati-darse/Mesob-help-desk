import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, MenuItem, Button, Select, FormControl, InputLabel, Grid, Alert, Snackbar, Chip } from '@mui/material';
import { Send as SendIcon, Announcement as CampaignIcon, Group as GroupIcon } from '@mui/icons-material';
import { COMPANIES } from '../../../utils/companies';
import { ROLE_LABELS } from '../../../constants/roles';
import axios from 'axios';

const BroadcastCenter = () => {
    const [targetAudience, setTargetAudience] = useState('all');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('info');
    const [toastOpen, setToastOpen] = useState(false);
    const [history, setHistory] = useState([
        { id: 1, msg: 'Scheduled Maintenance at 2:00 AM', target: 'All Users', time: 'Yesterday' },
        { id: 2, msg: 'Ethio Telecom network restored', target: 'Ethio Telecom', time: '2 days ago' },
    ]);

    const handleSend = async () => {
        if (!message.trim()) return;

        try {
            // Parse target audience
            let targetType = 'all';
            let targetValue = '';

            if (targetAudience.startsWith('company-')) {
                targetType = 'company';
                targetValue = targetAudience.replace('company-', '');
            } else if (targetAudience.startsWith('role-')) {
                targetType = 'role';
                // Map local role keys to actual DB role strings if needed
                const roleMap = {
                    super_admin: 'Super Admin',
                    sys_admin: 'System Admin',
                    technician: 'Technician',
                    employee: 'Employee'
                };
                const key = targetAudience.replace('role-', '');
                targetValue = roleMap[key] || 'Employee';
            }

            await axios.post('/api/notifications/broadcast', {
                message,
                priority,
                targetType,
                targetValue
            });

            setToastOpen(true);
            const newLog = {
                id: Date.now(),
                msg: message,
                target: targetAudience === 'all' ? 'All Users' : targetValue || targetAudience,
                time: 'Just now'
            };
            setHistory([newLog, ...history]);
            setMessage('');
        } catch (error) {
            console.error(error);
            alert('Failed to broadcast message');
        }
    };

    return (
        <Box maxWidth="1000px" margin="0 auto">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#0A1929' }}>
                Broadcast Center
            </Typography>

            <Grid container spacing={4}>
                {/* Compose Form */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <CampaignIcon color="primary" sx={{ fontSize: 40 }} />
                            <Box>
                                <Typography variant="h6">Compose Message</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Send alerts to active users in real-time.
                                </Typography>
                            </Box>
                        </Box>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Target Audience</InputLabel>
                            <Select
                                value={targetAudience}
                                label="Target Audience"
                                onChange={(e) => setTargetAudience(e.target.value)}
                            >
                                <MenuItem value="all">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <GroupIcon fontSize="small" /> All Active Users (Global)
                                    </Box>
                                </MenuItem>
                                <MenuItem disabled>--- Specific Company ---</MenuItem>
                                {COMPANIES.map(c => (
                                    <MenuItem key={c.id} value={`company-${c.id}`}>{c.name}</MenuItem>
                                ))}
                                <MenuItem disabled>--- Specific Role ---</MenuItem>
                                {Object.entries(ROLE_LABELS).map(([key, val]) => (
                                    <MenuItem key={key} value={`role-${key}`}>{val}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Priority Level</InputLabel>
                            <Select
                                value={priority}
                                label="Priority Level"
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <MenuItem value="info">Info (Blue)</MenuItem>
                                <MenuItem value="warning">Warning (Orange)</MenuItem>
                                <MenuItem value="error">Critical (Red)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Message Content"
                            placeholder="Type your announcement here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<SendIcon />}
                            onClick={handleSend}
                            color={priority === 'error' ? 'error' : priority === 'warning' ? 'warning' : 'primary'}
                        >
                            Broadcast Message
                        </Button>
                    </Paper>
                </Grid>

                {/* History */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Recent Broadcasts</Typography>
                        {history.map((item) => (
                            <Box key={item.id} sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>{item.msg}</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                    <Chip label={item.target} size="small" variant="outlined" />
                                    <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
            </Grid>

            {/* Toast Mock */}
            <Snackbar
                open={toastOpen}
                autoHideDuration={4000}
                onClose={() => setToastOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={priority} variant="filled" onClose={() => setToastOpen(false)}>
                    📡 Sending: "{message}" to {targetAudience}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BroadcastCenter;
