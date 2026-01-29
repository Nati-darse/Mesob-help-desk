import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Dashboard as DashboardIcon, Assignment as AssignmentIcon, Business as BusinessIcon } from '@mui/icons-material';
import BossDashboard from '../features/admin/pages/BossDashboard';
import ManualAssignment from '../features/admin/pages/ManualAssignment';
import CompanyDirectory from '../features/admin/pages/CompanyDirectory';

export const SysAdminDashboard = () => <Container><Box sx={{ mt: 4 }}><Typography variant="h4">System Admin Dashboard</Typography></Box></Container>;

export const SuperAdminDashboard = () => {
    return <AdminHome />;
};

const AdminHome = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>
                Super Admin Command Center
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
                Select a tool to get started
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main' }
                        }}
                    >
                        <DashboardIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Pulse Dashboard
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            System-wide analytics and metrics for all 19 organizations
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/dashboard"
                            fullWidth
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            View Analytics
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: 'success.main' }
                        }}
                    >
                        <AssignmentIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Manual Assignment
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Smart ticket distribution with suggesting technicians
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/assign"
                            fullWidth
                            color="success"
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Assign Tickets
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: 'warning.main' }
                        }}
                    >
                        <BusinessIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Company Directory
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            View all 19 bureaus with ticket status and alerts
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/companies"
                            fullWidth
                            color="warning"
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Browse Directory
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: '#0061f2' }
                        }}
                    >
                        <Box sx={{ fontSize: 60, mb: 2 }}>👥</Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            User Directory
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Register new staff (Team Leads, Techs) and manage roles
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/users"
                            fullWidth
                            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#0061f2' }}
                        >
                            Open Directory
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: 'secondary.main' }
                        }}
                    >
                        <Box sx={{ fontSize: 60, mb: 2 }}>📡</Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Broadcast
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Send real-time alerts and announcements to all users
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/broadcast"
                            fullWidth
                            color="secondary"
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Start Broadcast
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: 'info.main' }
                        }}
                    >
                        <AssignmentIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Resolution Review
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Audit and finalize resolved tickets waiting for closure
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/reviews"
                            fullWidth
                            color="info"
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Open Review Queue
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            border: '2px solid',
                            borderColor: 'divider',
                            borderRadius: 4,
                            textAlign: 'center',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', borderColor: 'grey.700' }
                        }}
                    >
                        <Box sx={{ fontSize: 60, mb: 2 }}>⚙️</Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Settings
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Toggle maintenance mode and manage system configurations
                        </Typography>
                        <Button
                            variant="contained"
                            component={RouterLink}
                            to="/admin/settings"
                            fullWidth
                            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: 'grey.700', '&:hover': { bgcolor: 'grey.800' } }}
                        >
                            System Settings
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};
