import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, TextField, Button, Divider, Alert } from '@mui/material';
import { Save as SaveIcon, VpnKey as KeyIcon, Email as EmailIcon, Construction as BuildIcon } from '@mui/icons-material';
import axios from 'axios';

const GlobalSettings = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [emailSettings, setEmailSettings] = useState({
        host: 'smtp.gmail.com',
        port: '587',
        user: 'mesobithelpdesk@gmail.com',
        pass: '••••••••••••'
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('/api/settings/maintenance');
                setMaintenanceMode(!!res.data.maintenance);
            } catch {}
        };
        load();
    }, []);

    const handleSave = async () => {
        try {
            await axios.put('/api/settings/maintenance', { maintenance: maintenanceMode });
            alert('Settings Saved Successfully');
        } catch {
            alert('Failed to save settings');
        }
    };

    return (
        <Box maxWidth="1000px" margin="0 auto">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#0A1929' }}>
                Global Settings
            </Typography>

            <Grid container spacing={3}>
                {/* General Settings */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <BuildIcon color="primary" />
                            <Typography variant="h6">General Configuration</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">Maintenance Mode</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Lock access for all users except System Admins.
                                </Typography>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={maintenanceMode}
                                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                                        color="error"
                                    />
                                }
                                label={maintenanceMode ? "Enabled" : "Disabled"}
                            />
                        </Box>

                        {maintenanceMode && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                ⚠️ The application is currently locked. Non-admin users cannot login.
                            </Alert>
                        )}
                    </Paper>
                </Grid>

                {/* Email Server (SMTP) */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <EmailIcon color="primary" />
                            <Typography variant="h6">SMTP Settings</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={8}>
                                <TextField
                                    fullWidth label="SMTP Host"
                                    value={emailSettings.host}
                                    onChange={(e) => setEmailSettings({...emailSettings, host: e.target.value})}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth label="Port"
                                    value={emailSettings.port}
                                    onChange={(e) => setEmailSettings({...emailSettings, port: e.target.value})}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth label="Username"
                                    value={emailSettings.user}
                                    onChange={(e) => setEmailSettings({...emailSettings, user: e.target.value})}
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth label="Password"
                                    value={emailSettings.pass}
                                    onChange={(e) => setEmailSettings({...emailSettings, pass: e.target.value})}
                                    type="password"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* API Keys Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <KeyIcon color="primary" />
                            <Typography variant="h6">Essential API Keys</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="subtitle2" gutterBottom>JWT Secret</Typography>
                        <TextField
                            fullWidth
                            value={process.env.JWT_SECRET || 'Configure in server environment'}
                            disabled
                            size="small"
                            type="password"
                            sx={{ mb: 2 }}
                            placeholder="jwt_secret_key_2024"
                        />

                        <Typography variant="subtitle2" gutterBottom>Database Connection</Typography>
                        <TextField
                            fullWidth
                            value={process.env.MONGODB_URI || 'Configure in server environment'}
                            disabled
                            size="small"
                            type="password"
                            sx={{ mb: 2 }}
                            placeholder="mongodb://localhost:27017/helpdesk_db"
                        />

                        <Button variant="outlined" sx={{ mt: 2 }} fullWidth>
                            Rotate Security Keys
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined">Discard Changes</Button>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                            Save Configuration
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GlobalSettings;
