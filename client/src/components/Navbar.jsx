import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #eee' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <img src={logo} alt="Mesob Logo" style={{ height: 40 }} />
                    <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 'bold', display: { xs: 'none', sm: 'block' } }}>
                        MESOB HELP DESK
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
                    {user ? (
                        <>
                            <Button color="primary" component={RouterLink} to="/dashboard" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Dashboard</Button>
                            <Button color="primary" component={RouterLink} to="/tickets" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Tickets</Button>
                            <Button variant="outlined" color="primary" onClick={handleLogout} sx={{ ml: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Logout</Button>
                        </>
                    ) : (
                        <>
                            <Button color="primary" component={RouterLink} to="/login" sx={{ px: { xs: 1, sm: 2 } }}>Login</Button>
                            <Button variant="contained" color="primary" component={RouterLink} to="/register" sx={{ px: { xs: 1, sm: 2 } }}>Register</Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
