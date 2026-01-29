import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Link, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../../../assets/logo.png';
import { ROLES } from '../../../constants/roles';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const getRedirectPath = (role) => {
        // Normalize role string (trim whitespace)
        const normalizedRole = String(role).trim();
        
        console.log('🔍 Login - User Role:', normalizedRole);
        console.log('🔍 Login - Role Constants:', ROLES);
        
        // Direct string comparison for reliability
        if (normalizedRole === 'System Admin') return '/sys-admin';
        if (normalizedRole === 'Super Admin') return '/admin';
        if (normalizedRole === 'Technician') return '/tech';
        if (normalizedRole === 'Team Lead') return '/team-lead';
        if (normalizedRole === 'Worker') return '/portal';
        
        // Fallback
        console.warn('⚠️ Unknown role:', normalizedRole, '- redirecting to login');
        return '/login';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            
            if (result.success) {
                console.log('✅ Login successful:', result.user);
                const redirectPath = getRedirectPath(result.user.role);
                console.log('🚀 Redirecting to:', redirectPath);
                
                // Small delay to ensure state is updated
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 100);
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ p: 4, width: '100%', textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <img src="/logo.png" alt="Mesob Logo" style={{ height: 80 }} onError={(e) => { e.currentTarget.src = logo; }} />
                </Box>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {t('auth.welcomeBack')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    {t('auth.loginPrompt')}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label={t('auth.email')}
                        variant="outlined"
                        margin="normal"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label={t('auth.password')}
                        type="password"
                        variant="outlined"
                        margin="normal"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2, height: 48 }}
                    >
                        {loading ? t('auth.loggingIn') : t('auth.login')}
                    </Button>
                </form>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                        {t('auth.securePortal')}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;
