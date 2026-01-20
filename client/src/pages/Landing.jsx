import { Box, Typography, Button, Container, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import logo from '../assets/logo.png';
import { keyframes } from '@emotion/react';
import RoleBasedRedirect from '../components/RoleBasedRedirect';


const Landing = () => {
    const { user } = useAuth();

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: (theme) => theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)'
                    : 'linear-gradient(135deg, #121212 0%, #0a192f 100%)',
                position: 'relative',
                py: { xs: 8, md: 0 },
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            {/* Decorative background elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: (theme) => theme.palette.mode === 'light'
                        ? 'rgba(30, 79, 177, 0.05)'
                        : 'rgba(30, 79, 177, 0.15)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -50,
                    left: -50,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: (theme) => theme.palette.mode === 'light'
                        ? 'rgba(30, 79, 177, 0.03)'
                        : 'rgba(30, 79, 177, 0.1)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}
            />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 8 } }}>
                <Stack spacing={{ xs: 6, md: 10 }} alignItems="center" textAlign="center">
                    {/* Circular Logo Container */}
                    <Box
                        sx={{
                            width: { xs: 180, md: 240 },
                            height: { xs: 180, md: 240 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            bgcolor: 'background.paper',
                            boxShadow: (theme) => theme.palette.mode === 'light'
                                ? '0 30px 60px rgba(30, 79, 177, 0.18)'
                                : '0 30px 60px rgba(0, 0, 0, 0.5)',
                            p: 0,
                            overflow: 'hidden',
                            border: '6px solid',
                            borderColor: 'background.paper'
                        }}
                    >
                        <img
                            src="/logo.png"
                            alt="Mesob Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                            onError={(e) => { e.currentTarget.src = logo; }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            variant="h1"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 900,
                                color: 'primary.main',
                                fontSize: { xs: '2.5rem', sm: '4rem', md: '5.5rem' },
                                letterSpacing: '-0.04em',
                                lineHeight: 1.1,
                                mb: 2
                            }}
                        >
                            MESOB HELP DESK
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                color: 'text.secondary',
                                mb: 6,
                                fontWeight: 400,
                                maxWidth: '800px',
                                mx: 'auto',
                                lineHeight: 1.4,
                                fontSize: { xs: '1.1rem', md: '1.75rem' }
                            }}
                        >
                            Elevating your workplace productivity with professional, real-time IT support and ticket management.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ width: '100%', maxWidth: '500px', mx: 'auto' }}>
                            {user ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    component={RouterLink}
                                    to="/redirect"
                                    sx={{
                                        px: 6,
                                        py: 2.5,
                                        fontSize: '1.2rem',
                                        borderRadius: '16px',
                                        boxShadow: (theme) => theme.palette.mode === 'light'
                                            ? '0 15px 30px rgba(30, 79, 177, 0.25)'
                                            : '0 15px 30px rgba(0, 0, 0, 0.4)',
                                        textTransform: 'none',
                                        fontWeight: 700
                                    }}
                                >
                                    Go to Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        component={RouterLink}
                                        to="/login"
                                        sx={{
                                            px: 6,
                                            py: 2.5,
                                            fontSize: '1.2rem',
                                            borderRadius: '16px',
                                            boxShadow: (theme) => theme.palette.mode === 'light'
                                                ? '0 15px 30px rgba(30, 79, 177, 0.25)'
                                                : '0 15px 30px rgba(0, 0, 0, 0.4)',
                                            textTransform: 'none',
                                            fontWeight: 700
                                        }}
                                    >
                                        Member Login
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        component={RouterLink}
                                        to="/register"
                                        sx={{
                                            px: 6,
                                            py: 2.5,
                                            fontSize: '1.2rem',
                                            borderRadius: '16px',
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderWidth: '2px',
                                            '&:hover': {
                                                borderWidth: '2px'
                                            }
                                        }}
                                    >
                                        Register
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* Feature Highlights */}
                    <Grid container spacing={4} sx={{ mt: 8, width: '100%' }}>
                        {[
                            { title: 'Fast Response', desc: 'Industry-leading resolution times' },
                            { title: 'Real-time Updates', desc: 'Instant notifications and tracking' },
                            { title: 'Role-Based Access', desc: 'Secure environment for all tasks' }
                        ].map((item, i) => (
                            <Grid key={i} size={{ xs: 12, sm: 4 }}>
                                <Box sx={{
                                    p: 4,
                                    height: '100%',
                                    borderRadius: 6,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    opacity: 0.9,
                                    backdropFilter: 'blur(15px)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-10px)',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                                    }
                                }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>{item.title}</Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>{item.desc}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Stack>
            </Container>
        </Box>
    );
};

export default Landing;
