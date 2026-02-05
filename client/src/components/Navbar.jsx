import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    IconButton,
    Tooltip,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Brightness4,
    Brightness7,
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    ConfirmationNumber as TicketIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../features/auth/context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import { getCompanyById } from '../utils/companies';
import TruncatedText from './TruncatedText';
import LanguageSelector from './LanguageSelector';
import logo from '../assets/logo.png';
import { ROLES } from '../constants/roles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { t } = useTranslation();

    const company = user?.companyId ? getCompanyById(user.companyId) : null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfileClick = () => {
        handleMenuClose();
        navigate('/profile');
    };

    const handleMobileNavOpen = () => setMobileNavOpen(true);
    const handleMobileNavClose = () => setMobileNavOpen(false);

    const handleNav = (path) => {
        navigate(path);
        handleMobileNavClose();
    };

    const mobileNavItems = [
        ...(user?.role === ROLES.SYSTEM_ADMIN
            ? [{ label: 'SysAdmin', to: '/sys-admin', icon: <AdminIcon /> }]
            : []),
        ...(user?.role === ROLES.SUPER_ADMIN
            ? [{ label: 'SuperAdmin', to: '/admin', icon: <AdminIcon /> }]
            : []),
        ...(user
            ? [
                { label: t('nav.dashboard'), to: '/redirect', icon: <DashboardIcon /> },
                { label: t('nav.tickets'), to: '/tickets', icon: <TicketIcon /> }
            ]
            : [{ label: t('auth.login'), to: '/login', icon: <LoginIcon /> }])
    ];

    return (
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
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
                {isMobile ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title="Menu">
                            <IconButton onClick={handleMobileNavOpen} color="inherit">
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                        {user ? (
                            <>
                                {user.role === ROLES.SYSTEM_ADMIN && (
                                    <Button color="primary" component={RouterLink} to="/sys-admin" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 700 }}>SysAdmin</Button>
                                )}
                                {user.role === ROLES.SUPER_ADMIN && (
                                    <Button color="secondary" component={RouterLink} to="/admin" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 700 }}>SuperAdmin</Button>
                                )}
                                <Button color="primary" component={RouterLink} to="/redirect" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{t('nav.dashboard')}</Button>
                                <Button color="primary" component={RouterLink} to="/tickets" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{t('nav.tickets')}</Button>

                                {/* Dark Mode Toggle */}
                                <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                                    <IconButton onClick={toggleColorMode} color="inherit" sx={{ ml: 0.5 }}>
                                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                                    </IconButton>
                                </Tooltip>

                                {/* Language Selector */}
                                <LanguageSelector />

                                {/* Profile Avatar with Dropdown */}
                                <Avatar
                                    src={user.profilePic}
                                    alt={user.name}
                                    onClick={handleMenuOpen}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        cursor: 'pointer',
                                        bgcolor: 'primary.main',
                                        border: '2px solid',
                                        borderColor: 'background.paper',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            boxShadow: 2
                                        }
                                    }}
                                >
                                    {!user.profilePic && user.name?.charAt(0)}
                                </Avatar>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    PaperProps={{
                                        sx: {
                                            mt: 1.5,
                                            minWidth: 200,
                                            borderRadius: 2,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <Box sx={{ px: 2, py: 1.5 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {user.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {user.role}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
                                        {t('nav.myProfile')}
                                    </MenuItem>
                                    <Divider />
                                    <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }} sx={{ py: 1.5, color: 'error.main' }}>
                                        {t('auth.logout')}
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <>
                                {/* Dark Mode Toggle for logged out users */}
                                <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                                    <IconButton onClick={toggleColorMode} color="inherit" sx={{ ml: 0.5 }}>
                                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                                    </IconButton>
                                </Tooltip>
                                <LanguageSelector />
                                <Button variant="contained" color="primary" component={RouterLink} to="/login" sx={{ px: { xs: 2, sm: 4 } }}>{t('auth.login')}</Button>
                            </>
                        )}
                    </Box>
                )}
            </Toolbar>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="right"
                open={mobileNavOpen}
                onClose={handleMobileNavClose}
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: 280 } }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src="/logo.png" alt="Mesob Logo" style={{ height: 32 }} onError={(e) => { e.currentTarget.src = logo; }} />
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                            MESOB HELP DESK
                        </Typography>
                    </Box>
                    <Divider />
                    <List sx={{ flexGrow: 0 }}>
                        {mobileNavItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemButton onClick={() => handleNav(item.to)}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    {user && (
                        <>
                            <Divider />
                            <List>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleNav('/profile')}>
                                        <ListItemIcon><PersonIcon /></ListItemIcon>
                                        <ListItemText primary={t('nav.myProfile')} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => { handleMobileNavClose(); handleLogout(); }}>
                                        <ListItemIcon><LogoutIcon /></ListItemIcon>
                                        <ListItemText primary={t('auth.logout')} />
                                    </ListItemButton>
                                </ListItem>
                            </List>
                        </>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <Divider />
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                            <IconButton onClick={toggleColorMode} color="inherit">
                                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                            </IconButton>
                        </Tooltip>
                        <LanguageSelector />
                    </Box>
                </Box>
            </Drawer>
        </AppBar>
    );
};

export default Navbar;
