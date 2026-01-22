import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, IconButton, useTheme } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import AvailabilityToggle from '../../../components/AvailabilityToggle';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLES } from '../../../constants/roles';

const DRAWER_WIDTH = 280;
const SUPER_ADMIN_ACCENT = '#1e4fb1'; // Brand Blue
const NAVY_BG = '#0A1929'; // Deep Navy

const SuperAdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    // Guard Clause
    if (user?.role !== ROLES.SUPER_ADMIN) {
        return null;
    }

    const menuItems = [
        { text: 'Command Center', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Analytics', icon: <TrendingUpIcon />, path: '/admin/dashboard' },
        { text: 'Manual Assignment', icon: <AssignmentIcon />, path: '/admin/assign' },
        { text: 'Organization Registry', icon: <BusinessIcon />, path: '/admin/companies' },
        { text: 'Global User Directory', icon: <PeopleIcon />, path: '/admin/users' },
        { text: 'Broadcast Center', icon: <Typography variant="h6" sx={{ fontSize: 20 }}>📡</Typography>, path: '/admin/broadcast' },
        { text: 'Global Settings', icon: <SettingsIcon />, path: '/admin/settings' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: NAVY_BG,
                        color: 'white',
                        borderRight: 'none',
                    },
                }}
            >
                {/* Header Badge */}
                <Box sx={{
                    p: 3,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Avatar sx={{ bgcolor: SUPER_ADMIN_ACCENT, color: 'white' }}>
                        <TrendingUpIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: SUPER_ADMIN_ACCENT, letterSpacing: 1 }}>
                            MESOB ADMIN
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            IT Operations Manager
                        </Typography>
                    </Box>
                </Box>

                {/* Navigation */}
                <List sx={{ px: 2, py: 2 }}>
                    {menuItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 1,
                                        borderLeft: active ? `4px solid ${SUPER_ADMIN_ACCENT}` : '4px solid transparent',
                                        bgcolor: active ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ color: active ? SUPER_ADMIN_ACCENT : 'rgba(255,255,255,0.7)' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontWeight: active ? 600 : 400,
                                            color: active ? 'white' : 'rgba(255,255,255,0.7)'
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>

                <Box sx={{ flexGrow: 1 }} />

                {/* Footer / Availability & Logout */}
                <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Box sx={{ mb: 2 }}>
                        <AvailabilityToggle variant="vertical" sx={{ color: 'white' }} />
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                    <ListItem disablePadding sx={{ borderRadius: 1, color: '#ff4444' }}>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon sx={{ color: '#ff4444' }}>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Exit System" />
                        </ListItemButton>
                    </ListItem>
                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default SuperAdminLayout;
