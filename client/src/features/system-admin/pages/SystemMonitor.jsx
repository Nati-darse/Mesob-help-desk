import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, TextField, Button, Alert, Snackbar, CircularProgress
} from '@mui/material';
import {
    Speed as SpeedIcon,
    Hub as HubIcon,
    Campaign as CampaignIcon
} from '@mui/icons-material';

const SystemMonitor = () => {
    const [socketCount, setSocketCount] = useState(124);
    const [apiLatency, setApiLatency] = useState(45);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastSeverity, setBroadcastSeverity] = useState('info');
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '' });

    // Mock live data updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly fluctuate socket count +/- 5
            setSocketCount(prev => Math.max(0, prev + Math.floor(Math.random() * 11) - 5));
            // Randomly fluctuate latency between 30ms and 150ms
            setApiLatency(Math.floor(Math.random() * (150 - 30 + 1) + 30));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleBroadcast = async () => {
        if (!broadcastMsg) return;
        setSending(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSending(false);
        setToast({ open: true, message: 'Emergency broadcast sent to 19 organizations.' });
        setBroadcastMsg('');
    };

    return (
        <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Gauge 1: Active Socket Connections */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            textAlign: 'center',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={100}
                                size={120}
                                thickness={4}
                                sx={{ color: 'action.hover' }}
                            />
                            <CircularProgress
                                variant="determinate"
                                value={65} // static visualization
                                size={120}
                                thickness={4}
                                sx={{
                                    color: 'primary.main',
                                    position: 'absolute',
                                    left: 0,
                                }}
                            />
                            <Box
                                sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}
                            >
                                <HubIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                            </Box>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {socketCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Active Socket.io Connections
                        </Typography>
                    </Paper>
                </Grid>

                {/* Gauge 2: API Response Time */}
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            textAlign: 'center',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                            <CircularProgress
                                variant="determinate"
                                value={100}
                                size={120}
                                thickness={4}
                                sx={{ color: 'action.hover' }}
                            />
                            <CircularProgress
                                variant="determinate"
                                value={(apiLatency / 200) * 100}
                                size={120}
                                thickness={4}
                                sx={{
                                    color: apiLatency > 100 ? 'error.main' : 'success.main',
                                    position: 'absolute',
                                    left: 0,
                                    transition: 'stroke-dashoffset 0.5s ease 0s'
                                }}
                            />
                            <Box
                                sx={{
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <SpeedIcon sx={{ color: apiLatency > 100 ? 'error.main' : 'success.main', fontSize: 40 }} />
                            </Box>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: apiLatency > 100 ? 'error.main' : 'inherit' }}>
                            {apiLatency}ms
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Avg API Response Time
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Emergency Broadcast */}
            <Paper sx={{ p: 4, border: '1px solid', borderColor: 'error.main', bgcolor: 'error.lighter' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <CampaignIcon color="error" fontSize="large" />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                            Emergency Broadcast System
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Send instant alerts to all connected users across all 19 organizations.
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Broadcast Message"
                            multiline
                            rows={3}
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            placeholder="e.g., System maintenance scheduled for 22:00..."
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <CampaignIcon />}
                            onClick={handleBroadcast}
                            disabled={!broadcastMsg || sending}
                        >
                            {sending ? 'Broadcasting...' : 'Broadcast Alert'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setToast({ ...toast, open: false })} severity="success" sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SystemMonitor;
