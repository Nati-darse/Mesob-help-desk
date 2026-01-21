import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Grid, Switch, FormControlLabel, TextField, Button, Divider, 
    Alert, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton, Chip, Snackbar, Tab, Tabs, Card, CardContent
} from '@mui/material';
import { 
    Save as SaveIcon, VpnKey as KeyIcon, Email as EmailIcon, Construction as BuildIcon,
    Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon, Storage as StorageIcon, Cloud as CloudIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import axios from 'axios';

const GlobalSettings = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Environment Variables
    const [envVars, setEnvVars] = useState([]);
    const [envDialog, setEnvDialog] = useState(false);
    const [editingEnv, setEditingEnv] = useState({ key: '', value: '', isNew: true });
    const [showValues, setShowValues] = useState({});
    
    // Email Settings
    const [emailSettings, setEmailSettings] = useState({
        host: 'smtp.gmail.com',
        port: '587',
        user: 'mesobithelpdesk@gmail.com',
        pass: '',
        secure: true
    });

    // System Settings
    const [systemSettings, setSystemSettings] = useState({
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        enableTwoFactor: false,
        allowRegistration: true,
        maintenanceMessage: 'System is under maintenance. Please try again later.'
    });

    useEffect(() => {
        loadSettings();
        loadEnvironmentVariables();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await axios.get('/api/settings/maintenance');
            setMaintenanceMode(!!res.data.maintenance);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const loadEnvironmentVariables = async () => {
        try {
            // Mock environment variables - in real implementation, this would be secured
            const mockEnvVars = [
                { key: 'JWT_SECRET', value: 'your-secret-key-here', sensitive: true },
                { key: 'MONGODB_URI', value: 'mongodb://localhost:27017/mesob', sensitive: true },
                { key: 'SMTP_HOST', value: 'smtp.gmail.com', sensitive: false },
                { key: 'SMTP_PORT', value: '587', sensitive: false },
                { key: 'STRIPE_SECRET_KEY', value: 'sk_test_51Mz...', sensitive: true },
                { key: 'GOOGLE_MAPS_API_KEY', value: 'AIzaSyA...', sensitive: true },
                { key: 'SESSION_TIMEOUT', value: '3600', sensitive: false },
                { key: 'MAX_LOGIN_ATTEMPTS', value: '5', sensitive: false }
            ];
            setEnvVars(mockEnvVars);
        } catch (error) {
            console.error('Failed to load environment variables:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put('/api/settings/maintenance', { maintenance: maintenanceMode });
            setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnvSave = () => {
        if (editingEnv.isNew) {
            setEnvVars([...envVars, { ...editingEnv, sensitive: editingEnv.key.toLowerCase().includes('secret') || editingEnv.key.toLowerCase().includes('key') }]);
        } else {
            setEnvVars(envVars.map(env => env.key === editingEnv.key ? editingEnv : env));
        }
        setEnvDialog(false);
        setEditingEnv({ key: '', value: '', isNew: true });
        setSnackbar({ open: true, message: 'Environment variable updated!', severity: 'success' });
    };

    const handleEnvDelete = (key) => {
        if (window.confirm(`Are you sure you want to delete ${key}?`)) {
            setEnvVars(envVars.filter(env => env.key !== key));
            setSnackbar({ open: true, message: 'Environment variable deleted!', severity: 'info' });
        }
    };

    const toggleValueVisibility = (key) => {
        setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Box maxWidth="1200px" margin="0 auto">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0A1929' }}>
                        ⚙️ Global System Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Advanced system settings and environment management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                    size="large"
                >
                    Save All Changes
                </Button>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="General Settings" icon={<BuildIcon />} />
                    <Tab label="Environment Variables" icon={<StorageIcon />} />
                    <Tab label="Email Configuration" icon={<EmailIcon />} />
                    <Tab label="Security Settings" icon={<SecurityIcon />} />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    {/* Maintenance Mode */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <BuildIcon color="primary" />
                                    <Typography variant="h6">System Maintenance</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Maintenance Mode</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Lock access for all users except System Admins
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

                                <TextField
                                    fullWidth
                                    label="Maintenance Message"
                                    multiline
                                    rows={2}
                                    value={systemSettings.maintenanceMessage}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                                    sx={{ mt: 2 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Grid container spacing={3}>
                    {/* Environment Variables */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <StorageIcon color="primary" />
                                        <Typography variant="h6">Environment Variables</Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            setEditingEnv({ key: '', value: '', isNew: true });
                                            setEnvDialog(true);
                                        }}
                                    >
                                        Add Variable
                                    </Button>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    ⚠️ Modifying environment variables requires application restart to take effect.
                                </Alert>

                                <List>
                                    {envVars.map((env, index) => (
                                        <ListItem key={env.key} divider>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {env.key}
                                                        </Typography>
                                                        {env.sensitive && (
                                                            <Chip label="Sensitive" size="small" color="warning" />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontFamily: 'monospace',
                                                            bgcolor: 'grey.100',
                                                            p: 1,
                                                            borderRadius: 1,
                                                            mt: 1
                                                        }}
                                                    >
                                                        {env.sensitive && !showValues[env.key] 
                                                            ? '••••••••••••' 
                                                            : env.value
                                                        }
                                                    </Typography>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {env.sensitive && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleValueVisibility(env.key)}
                                                        >
                                                            {showValues[env.key] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingEnv({ ...env, isNew: false });
                                                            setEnvDialog(true);
                                                        }}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleEnvDelete(env.key)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {activeTab === 2 && (
                <Grid container spacing={3}>
                    {/* Email Configuration */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <EmailIcon color="primary" />
                                    <Typography variant="h6">SMTP Configuration</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={2}>
                                    <Grid item xs={8}>
                                        <TextField
                                            fullWidth
                                            label="SMTP Host"
                                            value={emailSettings.host}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, host: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <TextField
                                            fullWidth
                                            label="Port"
                                            value={emailSettings.port}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, port: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Username"
                                            value={emailSettings.user}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, user: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Password"
                                            type="password"
                                            value={emailSettings.pass}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, pass: e.target.value }))}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={emailSettings.secure}
                                                    onChange={(e) => setEmailSettings(prev => ({ ...prev, secure: e.target.checked }))}
                                                />
                                            }
                                            label="Use TLS/SSL"
                                        />
                                    </Grid>
                                </Grid>

                                <Button variant="outlined" sx={{ mt: 2 }}>
                                    Test Email Configuration
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {activeTab === 3 && (
                <Grid container spacing={3}>
                    {/* Security Settings */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <SecurityIcon color="primary" />
                                    <Typography variant="h6">Security Configuration</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Session Timeout (seconds)"
                                            type="number"
                                            value={systemSettings.sessionTimeout}
                                            onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Max Login Attempts"
                                            type="number"
                                            value={systemSettings.maxLoginAttempts}
                                            onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Minimum Password Length"
                                            type="number"
                                            value={systemSettings.passwordMinLength}
                                            onChange={(e) => setSystemSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={systemSettings.enableTwoFactor}
                                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, enableTwoFactor: e.target.checked }))}
                                                />
                                            }
                                            label="Enable Two-Factor Authentication"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={systemSettings.allowRegistration}
                                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, allowRegistration: e.target.checked }))}
                                                />
                                            }
                                            label="Allow User Registration"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Environment Variable Dialog */}
            <Dialog open={envDialog} onClose={() => setEnvDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEnv.isNew ? 'Add Environment Variable' : 'Edit Environment Variable'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Variable Name"
                        value={editingEnv.key}
                        onChange={(e) => setEditingEnv(prev => ({ ...prev, key: e.target.value }))}
                        disabled={!editingEnv.isNew}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Value"
                        multiline
                        rows={3}
                        value={editingEnv.value}
                        onChange={(e) => setEditingEnv(prev => ({ ...prev, value: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEnvDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleEnvSave}>
                        {editingEnv.isNew ? 'Add' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default GlobalSettings;
