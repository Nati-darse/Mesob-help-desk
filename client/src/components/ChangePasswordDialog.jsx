import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Alert, Box, Typography, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { CheckCircle as CheckIcon, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';

const ChangePasswordDialog = ({ open, onClose, onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordRequirements = [
        { text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
        { text: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
        { text: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
        { text: 'Contains number', test: (pwd) => /[0-9]/.test(pwd) },
        { text: 'Contains special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        // Check password requirements
        const failedRequirements = passwordRequirements.filter(req => !req.test(newPassword));
        if (failedRequirements.length > 0) {
            setError('Password does not meet all requirements');
            return;
        }

        setLoading(true);
        try {
            await axios.put('/api/auth/change-first-password', {
                currentPassword,
                newPassword
            });

            // Update user in sessionStorage (not localStorage)
            const storedUser = JSON.parse(sessionStorage.getItem('mesob_user') || '{}');
            storedUser.isFirstLogin = false;
            sessionStorage.setItem('mesob_user', JSON.stringify(storedUser));

            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={() => {}} // Prevent closing by clicking outside
            maxWidth="sm" 
            fullWidth
            disableEscapeKeyDown // Prevent closing with ESC key
        >
            <DialogTitle>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Change Your Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    For security reasons, you must change your default password before continuing.
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Alert severity="info" sx={{ mb: 3 }}>
                        Your current password is: <strong>Mesob@123</strong>
                    </Alert>

                    <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        sx={{ mb: 2 }}
                        autoFocus
                    />

                    <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Password Requirements:
                    </Typography>
                    <List dense>
                        {passwordRequirements.map((req, index) => {
                            const isValid = req.test(newPassword);
                            return (
                                <ListItem key={index} sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        {isValid ? (
                                            <CheckIcon color="success" fontSize="small" />
                                        ) : (
                                            <CancelIcon color="disabled" fontSize="small" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={req.text}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            color: isValid ? 'success.main' : 'text.secondary'
                                        }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                >
                    {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangePasswordDialog;
