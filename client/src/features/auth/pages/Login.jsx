import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Link, Alert } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../../../assets/logo.png';
import { ROLES } from '../../../constants/roles';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const getRedirectPath = (role) => {
        switch (role) {
            case ROLES.SYSTEM_ADMIN:
                return '/sys-admin';
            case ROLES.SUPER_ADMIN:
                return '/admin';
            case ROLES.TECHNICIAN:
                return '/tech';
            case ROLES.TEAM_LEAD:
                return '/teamleaderdashboard';
            case ROLES.EMPLOYEE:
                return '/portal';
            default:
                return '/profile';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        if (result.success) {
            const redirectPath = getRedirectPath(result.user.role);
            navigate(redirectPath);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ p: 4, width: '100%', textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <img src="/logo.png" alt="Mesob Logo" style={{ height: 80 }} onError={(e) => { e.currentTarget.src = logo; }} />
                </Box>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Welcome Back
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    Please enter your credentials to access the help desk.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Password"
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
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                        Secure Access Portal • Managed by Mesob Admin
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;
