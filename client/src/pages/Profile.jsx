import React, { useState } from 'react';
import {
    Container, Box, Typography, Paper, TextField, Button, Avatar, Grid,
    Divider, Alert, IconButton, CircularProgress
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Save as SaveIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../features/auth/context/AuthContext';
import axios from 'axios';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        profilePic: user?.profilePic || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // For now, we'll create a temporary URL
            // In production, you'd upload to a service and get the URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, profilePic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.password && formData.password !== formData.confirmPassword) {
            return setMessage({ type: 'error', text: 'Passwords do not match' });
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                profilePic: formData.profilePic
            };
            if (formData.password) payload.password = formData.password;

            const res = await axios.put('/api/auth/profile', payload);

            // Update auth context with new user data including profilePic
            updateUser(res.data);

            setMessage({ type: 'success', text: 'Profile updated successfully! Your profile picture will appear across the platform.' });
            setFormData({ ...formData, password: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 4, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                My Profile
            </Typography>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={4}>
                    {/* Left: Avatar & Quick Info */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', borderRadius: 4 }}>
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={formData.profilePic}
                                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '3rem' }}
                                >
                                    {formData.name.charAt(0)}
                                </Avatar>
                                <IconButton
                                    color="primary"
                                    sx={{ position: 'absolute', bottom: 10, right: 0, bgcolor: 'background.paper', border: '1px solid divider' }}
                                    component="label"
                                >
                                    <input hidden accept="image/*" type="file" onChange={handleFileChange} />
                                    <PhotoCameraIcon />
                                </IconButton>
                            </Box>
                            <Typography variant="h6" fontWeight="bold">{user?.name}</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>{user?.role}</Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="caption" color="text.secondary">
                                Organization: {user?.department || 'Internal'}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Right: Forms */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4 }}>
                            {message.text && (
                                <Alert severity={message.type} sx={{ mb: 3 }}>
                                    {message.text}
                                </Alert>
                            )}

                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Personal Information</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Profile Picture URL"
                                        name="profilePic"
                                        value={formData.profilePic}
                                        onChange={handleChange}
                                        helperText="Provide a URL for your profile image"
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <LockIcon color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Security</Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="New Password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Confirm Password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                    disabled={loading}
                                    sx={{ borderRadius: 3, px: 4, width: { xs: '100%', sm: 'auto' } }}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </form>
        </Container>
    );
};

export default Profile;
