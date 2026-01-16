import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Link, Alert, MenuItem } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COMPANIES } from '../../../utils/companies';
import { ROLES } from '../../../constants/roles';
import logo from '../../../assets/logo.png';

const departments = [
    'IT Support',
    'Human Resources',
    'Finance',
    'Operations',
    'Marketing',
];

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: '',
        companyId: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const getRedirectPath = (role) => {
        switch (role) {
            case ROLES.SYSTEM_ADMIN:
                return '/sys-admin';
            case ROLES.SUPER_ADMIN:
                return '/admin';
            case ROLES.TECHNICIAN:
                return '/tech';
            case ROLES.EMPLOYEE:
                return '/portal';
            default:
                return '/dashboard';
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await register(formData);
        if (result.success) {
            const redirectPath = getRedirectPath(result.user.role);
            navigate(redirectPath);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Paper elevation={0} sx={{ p: 4, width: '100%', textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <img src={logo} alt="Mesob Logo" style={{ height: 60 }} />
                </Box>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Create Account
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        variant="outlined"
                        margin="normal"
                        required
                        value={formData.name}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        variant="outlined"
                        margin="normal"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth
                        select
                        label="Department"
                        name="department"
                        variant="outlined"
                        margin="normal"
                        required
                        value={formData.department}
                        onChange={handleChange}
                    >
                        {departments.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        select
                        label="Select Bureau / Organization"
                        name="companyId"
                        variant="outlined"
                        margin="normal"
                        required
                        value={formData.companyId}
                        onChange={handleChange}
                    >
                        {COMPANIES.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        variant="outlined"
                        margin="normal"
                        required
                        value={formData.password}
                        onChange={handleChange}
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
                        {loading ? 'Creating account...' : 'Register'}
                    </Button>
                </form>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <Link component={RouterLink} to="/login" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            Login here
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default Register;
