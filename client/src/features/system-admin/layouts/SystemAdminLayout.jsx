import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SearchIcon from '@mui/icons-material/Search';
import MonitorIcon from '@mui/icons-material/Monitor';
import CleanupIcon from '@mui/icons-material/DeleteSweep';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import TableViewIcon from '@mui/icons-material/TableView';
import MenuIcon from '@mui/icons-material/Menu';
import AvailabilityToggle from '../../../components/AvailabilityToggle';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLES } from '../../../constants/roles';

const DRAWER_WIDTH = 280;
const BRAND_BLUE = '#1e4fb1';
const ACCENT_BLUE = '#0061f2';
const NAVY_BG = '#0A1929'; // Deep Navy

const SystemAdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    // Guard Clause
    if (user?.role !== ROLES.SYSTEM_ADMIN) {
        return null; // Or redirect/unauthorized component handled by routes
    }

    const menuItems = [
        { text: 'System Overview', icon: <DashboardIcon />, path: '/sys-admin' },
        { text: 'Global Dashboard', icon: <AnalyticsIcon />, path: '/sys-admin/dashboard' },
        { text: 'Company Registry', icon: <BusinessIcon />, path: '/sys-admin/companies' },
        { text: 'User Management', icon: <PeopleIcon />, path: '/sys-admin/users' },
        { text: 'Master User Table', icon: <TableViewIcon />, path: '/sys-admin/master-users' },
        { text: 'Account Management', icon: <AccountBoxIcon />, path: '/sys-admin/accounts' },
        { text: 'Global Ticket Search', icon: <SearchIcon />, path: '/sys-admin/tickets' },
        { text: 'Cross-Tenant Analytics', icon: <AnalyticsIcon />, path: '/sys-admin/analytics' },
        { text: 'System Monitor', icon: <MonitorIcon />, path: '/sys-admin/monitor' },
        { text: 'Bulk Data Cleanup', icon: <CleanupIcon />, path: '/sys-admin/cleanup' },
        { text: 'Audit Logs', icon: <SecurityIcon />, path: '/sys-admin/audit-logs' },
        { text: 'Broadcast Center', icon: <Typography variant="h6" sx={{ fontSize: 20 }}>📡</Typography>, path: '/sys-admin/broadcast' },
        { text: 'Global Settings', icon: <Typography variant="h6" sx={{ fontSize: 20 }}>⚙️</Typography>, path: '/sys-admin/settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(prev => !prev);
    };

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
            {/* Sidebar */}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
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
                    <Avatar sx={{ bgcolor: ACCENT_BLUE, color: 'white' }}>
                        <SecurityIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white', letterSpacing: 1 }}>
                            MESOB ADMIN
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            System Administrator
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
                                    onClick={() => handleNavigate(item.path)}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 1,
                                        borderLeft: active ? `4px solid ${ACCENT_BLUE}` : '4px solid transparent',
                                        bgcolor: active ? 'rgba(0, 97, 242, 0.12)' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ color: active ? ACCENT_BLUE : 'rgba(255,255,255,0.7)' }}>
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
                        <ListItemButton onClick={() => { handleLogout(); setMobileOpen(false); }}>
                            <ListItemIcon sx={{ color: '#ff4444' }}>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Exit System" />
                        </ListItemButton>
                    </ListItem>
                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 2, p: 2, overflow: 'auto', minHeight: '100vh' }}>
                {isMobile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <IconButton onClick={handleDrawerToggle}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Navigation
                        </Typography>
                    </Box>
                )}
                <Outlet />
            </Box>
        </Box>
    );
};

export default SystemAdminLayout;
