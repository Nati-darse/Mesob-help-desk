import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, Avatar, IconButton, useTheme } from '@mui/material';
import {
    People as PeopleIcon,
    MonitorHeart as MonitorIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GlobalUserEditor from './GlobalUserEditor';
import SystemMonitor from './SystemMonitor';
import { useAuth } from '../../auth/context/AuthContext';

const drawerWidth = 280;

const ACCENT_BLUE = '#0061f2';

const SysAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{
            height: '100%',
            bgcolor: '#0a192f',
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    sx={{
                        bgcolor: 'transparent',
                        border: `2px solid ${ACCENT_BLUE}`,
                        color: ACCENT_BLUE,
                        fontWeight: 900
                    }}
                >
                    M
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                        MESOB ADMIN
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        System Admin
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Nav Items */}
            <List sx={{ flexGrow: 1, pt: 2 }}>
                <ListItem
                    button
                    selected={activeTab === 'users'}
                    onClick={() => setActiveTab('users')}
                    sx={{
                        mb: 1,
                        mx: 1,
                        borderRadius: 2,
                        '&.Mui-selected': {
                            bgcolor: 'rgba(0, 97, 242, 0.12)',
                            borderLeft: `4px solid ${ACCENT_BLUE}`,
                            '&:hover': { bgcolor: 'rgba(0, 97, 242, 0.2)' }
                        },
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                >
                    <ListItemIcon sx={{ color: activeTab === 'users' ? ACCENT_BLUE : 'rgba(255,255,255,0.7)' }}>
                        <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="User Directory" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItem>

                <ListItem
                    button
                    selected={activeTab === 'monitor'}
                    onClick={() => setActiveTab('monitor')}
                    sx={{
                        mb: 1,
                        mx: 1,
                        borderRadius: 2,
                        '&.Mui-selected': {
                            bgcolor: 'rgba(0, 97, 242, 0.12)',
                            borderLeft: `4px solid ${ACCENT_BLUE}`,
                            '&:hover': { bgcolor: 'rgba(0, 97, 242, 0.2)' }
                        },
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                >
                    <ListItemIcon sx={{ color: activeTab === 'monitor' ? ACCENT_BLUE : 'rgba(255,255,255,0.7)' }}>
                        <MonitorIcon />
                    </ListItemIcon>
                    <ListItemText primary="System Monitor" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItem>
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Logout */}
            <Box sx={{ p: 2 }}>
                <ListItem
                    button
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 2,
                        color: '#ff6b6b',
                        '&:hover': { bgcolor: 'rgba(255, 107, 107, 0.1)' }
                    }}
                >
                    <ListItemIcon sx={{ color: '#ff6b6b' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Exit System" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItem>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Mobile Toggle */}
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' }, position: 'absolute', top: 16, left: 16, zIndex: 1100 }}
            >
                <MenuIcon />
            </IconButton>

            {/* Navigation Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: `1px solid ${ACCENT_BLUE}` },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    bgcolor: 'background.default'
                }}
            >
                {/* Content */}
                <Box sx={{ mt: { xs: 8, md: 0 } }}>
                    {activeTab === 'users' && <GlobalUserEditor />}
                    {activeTab === 'monitor' && <SystemMonitor />}
                </Box>
            </Box>
        </Box>
    );
};

export default SysAdminDashboard;
