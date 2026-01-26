import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { getCompanyById } from '../utils/companies';
import TruncatedText from './TruncatedText';
import logo from '../assets/logo.png';
import { ROLES } from '../constants/roles';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const company = user?.companyId ? getCompanyById(user.companyId) : null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', minWidth: 0 }} onClick={() => navigate('/')}>
                    <img src="/logo.png" alt="Mesob Logo" style={{ height: 40, flexShrink: 0 }} onError={(e) => { e.currentTarget.src = logo; }} />
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            MESOB HELP DESK
                        </Typography>
                        {user?.role === ROLES.SYSTEM_ADMIN ? (
                            <>
                                <Typography variant="h6" sx={{ color: 'divider', fontWeight: 300 }}>|</Typography>
                                <Typography variant="h6" sx={{ color: '#0061f2', fontWeight: 700, letterSpacing: 0.5 }}>
                                    Global Administrator
                                </Typography>
                            </>
                        ) : user?.role === ROLES.SUPER_ADMIN ? (
                            <>
                                <Typography variant="h6" sx={{ color: 'divider', fontWeight: 300 }}>|</Typography>
                                <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700, letterSpacing: 0.5 }}>
                                    Super Administrator
                                </Typography>
                            </>
                        ) : company ? (
                            <>
                                <Typography variant="h6" sx={{ color: 'divider', fontWeight: 300 }}>|</Typography>
                                <TruncatedText
                                    text={company.name}
                                    variant="h6"
                                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                                    maxWidth="300px"
                                />
                            </>
                        ) : null}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    {user ? (
                        <>
                            {user.role === ROLES.SYSTEM_ADMIN && (
                                <Button color="primary" component={RouterLink} to="/sys-admin" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 700 }}>SysAdmin</Button>
                            )}
                            {user.role === ROLES.SUPER_ADMIN && (
                                <Button color="secondary" component={RouterLink} to="/admin" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 700 }}>SuperAdmin</Button>
                            )}
                            <Button color="primary" component={RouterLink} to="/redirect" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Dashboard</Button>
                            <Button color="primary" component={RouterLink} to="/tickets" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Tickets</Button>
                            <Button color="primary" component={RouterLink} to="/profile" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Profile</Button>
                            <Button variant="outlined" color="primary" onClick={handleLogout} sx={{ ml: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Logout</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="contained" color="primary" component={RouterLink} to="/login" sx={{ px: { xs: 2, sm: 4 } }}>Login</Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
