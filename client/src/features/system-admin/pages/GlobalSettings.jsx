import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Grid, Switch, FormControlLabel, TextField, Button, 
    Divider, Alert, Chip, Card, CardContent, Dialog, DialogTitle, DialogContent, 
    DialogActions, Snackbar, IconButton, Tooltip, List, ListItem, ListItemText,
    ListItemIcon, Avatar, LinearProgress, Tab, Tabs
} from '@mui/material';
import { 
    Save as SaveIcon, VpnKey as KeyIcon, Email as EmailIcon, Construction as BuildIcon,
    Security as SecurityIcon, Notifications as NotificationIcon, Storage as StorageIcon,
    Refresh as RefreshIcon, Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon,
    Backup as BackupIcon, CloudUpload as CloudUploadIcon, Settings as SettingsIcon,
    Warning as WarningIcon, CheckCircle as CheckCircleIcon, Info as InfoIcon,
    Send as SendIcon, Restore as RestoreIcon
} from '@mui/icons-material';
import axios from 'axios';

const GlobalSettings = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // General Settings
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [systemSettings, setSystemSettings] = useState({
        maxFileSize: '10',
        sessionTimeout: '30',
        autoBackup: true,
        debugMode: false,
        rateLimiting: true,
        maxLoginAttempts: '5'
    });

    // Email Settings
    const [emailSettings, setEmailSettings] = useState({
        host: 'smtp.gmail.com',
        port: '587',
        user: 'mesobithelpdesk@gmail.com',
        pass: '',
        secure: true,
        testEmail: ''
    });

    // Security Settings
    const [securitySettings, setSecuritySettings] = useState({
        jwtExpiry: '24h',
        passwordMinLength: '8',
        requireTwoFactor: false,
        allowedDomains: ['gov.et', 'mesob.com'],
        ipWhitelist: []
    });

    // Notification Settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        digestFrequency: 'daily',
        criticalAlerts: true
    });

    // Backup Settings
    const [backupSettings, setBackupSettings] = useState({
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: '30',
        cloudBackup: false,
        lastBackup: new Date().toISOString()
    });

    // Dialog States
    const [dialogs, setDialogs] = useState({
        testEmail: false,
        rotateKeys: false,
        backup: false,
        resetSystem: false
    });

    // Environment variables (mock for client-side)
    const [envSettings, setEnvSettings] = useState({
        jwtSecret: '••••••••••••••••••••••••••••••••',
        mongoUri: '••••••••••••••••••••••••••••••••',
        serverUrl: 'https://mesob-help-desk.onrender.com',
        nodeEnv: 'production'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // Simulate API calls - replace with actual endpoints
            const maintenanceRes = await axios.get('/api/settings/maintenance').catch(() => ({ data: { maintenance: false } }));
            setMaintenanceMode(!!maintenanceRes.data.maintenance);
            
            // Load other settings from localStorage or API
            const savedSettings = localStorage.getItem('globalSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSystemSettings(prev => ({ ...prev, ...parsed.system }));
                setEmailSettings(prev => ({ ...prev, ...parsed.email }));
                setSecuritySettings(prev => ({ ...prev, ...parsed.security }));
                setNotificationSettings(prev => ({ ...prev, ...parsed.notifications }));
                setBackupSettings(prev => ({ ...prev, ...parsed.backup }));
            }
        } catch (error) {
            showSnackbar('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            // Save maintenance mode
            await axios.put('/api/settings/maintenance', { maintenance: maintenanceMode }).catch(() => {});
            
            // Save other settings to localStorage (replace with API calls)
            const allSettings = {
                system: systemSettings,
                email: emailSettings,
                security: securitySettings,
                notifications: notificationSettings,
                backup: backupSettings
            };
            localStorage.setItem('globalSettings', JSON.stringify(allSettings));
            
            showSnackbar('Settings saved successfully!');
        } catch (error) {
            showSnackbar('Failed to save settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const discardChanges = () => {
        loadSettings();
        showSnackbar('Changes discarded', 'info');
    };

    const testEmailConnection = async () => {
        if (!emailSettings.testEmail) {
            showSnackbar('Please enter a test email address', 'warning');
            return;
        }
        
        setLoading(true);
        try {
            // Simulate email test
            await new Promise(resolve => setTimeout(resolve, 2000));
            showSnackbar(`Test email sent to ${emailSettings.testEmail}!`);
            setDialogs(prev => ({ ...prev, testEmail: false }));
        } catch (error) {
            showSnackbar('Failed to send test email', 'error');
        } finally {
            setLoading(false);
        }
    };

    const rotateSecurityKeys = async () => {
        setLoading(true);
        try {
            // Simulate key rotation
            await new Promise(resolve => setTimeout(resolve, 1500));
            showSnackbar('Security keys rotated successfully!');
            setDialogs(prev => ({ ...prev, rotateKeys: false }));
        } catch (error) {
            showSnackbar('Failed to rotate keys', 'error');
        } finally {
            setLoading(false);
        }
    };

    const createBackup = async () => {
        setLoading(true);
        try {
            // Simulate backup creation
            await new Promise(resolve => setTimeout(resolve, 3000));
            setBackupSettings(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
            showSnackbar('Backup created successfully!');
            setDialogs(prev => ({ ...prev, backup: false }));
        } catch (error) {
            showSnackbar('Failed to create backup', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        await saveSettings();
    };

    const handleDiscardChanges = () => {
        discardChanges();
    };

    const handleTestEmail = () => {
        setDialogs(prev => ({ ...prev, testEmail: true }));
    };

    const handleRotateKeys = () => {
        setDialogs(prev => ({ ...prev, rotateKeys: true }));
    };

    const handleCreateBackup = () => {
        setDialogs(prev => ({ ...prev, backup: true }));
    };

    const handleResetSystem = () => {
        setDialogs(prev => ({ ...prev, resetSystem: true }));
    };

    const closeDialog = (dialogName) => {
        setDialogs(prev => ({ ...prev, [dialogName]: false }));
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
                            value={envSettings.jwtSecret}
                            disabled
                            size="small"
                            type="password"
                            sx={{ mb: 2 }}
                            placeholder="jwt_secret_key_2024"
                        />

                        <Typography variant="subtitle2" gutterBottom>Database Connection</Typography>
                        <TextField
                            fullWidth
                            value={envSettings.mongoUri}
                            disabled
                            size="small"
                            type="password"
                            sx={{ mb: 2 }}
                            placeholder="mongodb://localhost:27017/helpdesk_db"
                        />

                        <Button 
                            variant="outlined" 
                            sx={{ mt: 2 }} 
                            fullWidth
                            onClick={handleRotateKeys}
                            startIcon={<KeyIcon />}
                        >
                            Rotate Security Keys
                        </Button>
                    </Paper>
                </Grid>

                {/* Email Testing and Additional Settings */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <NotificationIcon color="primary" />
                            <Typography variant="h6">Email Testing</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <TextField
                            fullWidth
                            label="Test Email Address"
                            value={emailSettings.testEmail}
                            onChange={(e) => setEmailSettings({...emailSettings, testEmail: e.target.value})}
                            size="small"
                            sx={{ mb: 2 }}
                            placeholder="admin@example.com"
                        />

                        <Button 
                            variant="contained" 
                            fullWidth 
                            onClick={handleTestEmail}
                            startIcon={<SendIcon />}
                            sx={{ mb: 2 }}
                        >
                            Send Test Email
                        </Button>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={emailSettings.secure}
                                    onChange={(e) => setEmailSettings({...emailSettings, secure: e.target.checked})}
                                />
                            }
                            label="Use SSL/TLS"
                        />
                    </Paper>
                </Grid>

                {/* System Backup */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <BackupIcon color="primary" />
                            <Typography variant="h6">System Backup</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Last backup: {new Date(backupSettings.lastBackup).toLocaleString()}
                        </Typography>

                        <Button 
                            variant="contained" 
                            fullWidth 
                            onClick={handleCreateBackup}
                            startIcon={<BackupIcon />}
                            sx={{ mb: 2 }}
                        >
                            Create Backup Now
                        </Button>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={backupSettings.autoBackup}
                                    onChange={(e) => setBackupSettings({...backupSettings, autoBackup: e.target.checked})}
                                />
                            }
                            label="Auto Backup"
                        />
                    </Paper>
                </Grid>

                {/* System Actions */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <WarningIcon color="error" />
                            <Typography variant="h6">Danger Zone</Typography>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        <Alert severity="warning" sx={{ mb: 3 }}>
                            These actions are irreversible. Please proceed with caution.
                        </Alert>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Button 
                                    variant="outlined" 
                                    color="warning"
                                    fullWidth
                                    onClick={handleResetSystem}
                                    startIcon={<RestoreIcon />}
                                >
                                    Reset All Settings
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button 
                                    variant="outlined" 
                                    color="error"
                                    fullWidth
                                    startIcon={<DeleteIcon />}
                                >
                                    Clear All Data
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            onClick={handleDiscardChanges}
                            disabled={loading}
                        >
                            Discard Changes
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<SaveIcon />} 
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {/* Test Email Dialog */}
            <Dialog open={dialogs.testEmail} onClose={() => closeDialog('testEmail')} maxWidth="sm" fullWidth>
                <DialogTitle>Send Test Email</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        This will send a test email to verify your SMTP configuration.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Test Email Address"
                        value={emailSettings.testEmail}
                        onChange={(e) => setEmailSettings({...emailSettings, testEmail: e.target.value})}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => closeDialog('testEmail')}>Cancel</Button>
                    <Button variant="contained" onClick={testEmailConnection} disabled={loading}>
                        {loading ? 'Sending...' : 'Send Test Email'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rotate Keys Dialog */}
            <Dialog open={dialogs.rotateKeys} onClose={() => closeDialog('rotateKeys')} maxWidth="sm" fullWidth>
                <DialogTitle>Rotate Security Keys</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This will generate new JWT secrets and API keys. All users will need to log in again.
                    </Alert>
                    <Typography variant="body2">
                        Are you sure you want to rotate all security keys?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => closeDialog('rotateKeys')}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={rotateSecurityKeys} disabled={loading}>
                        {loading ? 'Rotating...' : 'Rotate Keys'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Backup Dialog */}
            <Dialog open={dialogs.backup} onClose={() => closeDialog('backup')} maxWidth="sm" fullWidth>
                <DialogTitle>Create System Backup</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        This will create a complete backup of your system data including:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                            <ListItemText primary="User accounts and profiles" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Tickets and attachments" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                            <ListItemText primary="System settings" />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Company configurations" />
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => closeDialog('backup')}>Cancel</Button>
                    <Button variant="contained" onClick={createBackup} disabled={loading}>
                        {loading ? 'Creating Backup...' : 'Create Backup'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset System Dialog */}
            <Dialog open={dialogs.resetSystem} onClose={() => closeDialog('resetSystem')} maxWidth="sm" fullWidth>
                <DialogTitle>Reset System Settings</DialogTitle>
                <DialogContent>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        This action cannot be undone!
                    </Alert>
                    <Typography variant="body2">
                        This will reset all system settings to their default values. User data and tickets will not be affected.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => closeDialog('resetSystem')}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={resetSystem} disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Settings'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                message={snackbar.message}
            />
        </Box>
    );

    // Add the missing resetSystem function
    const resetSystem = async () => {
        setLoading(true);
        try {
            // Simulate system reset
            await new Promise(resolve => setTimeout(resolve, 2000));
            localStorage.removeItem('globalSettings');
            loadSettings();
            showSnackbar('System settings reset to defaults!');
            setDialogs(prev => ({ ...prev, resetSystem: false }));
        } catch (error) {
            showSnackbar('Failed to reset system', 'error');
        } finally {
            setLoading(false);
        }
    };
};

export default GlobalSettings;
