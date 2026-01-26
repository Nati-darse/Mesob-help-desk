import { Box, Typography, Button, Container, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { ROLE_ROUTES } from '../constants/roles';
import logo from '../assets/logo.png';


const Landing = () => {
    const { user } = useAuth();

    return (
        <Box
            sx={{
                height: 'calc(100vh - 64px)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: (theme) => theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)'
                    : 'linear-gradient(135deg, #121212 0%, #0a192f 100%)',
                position: 'relative',
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

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center' }}>
                <Stack spacing={{ xs: 4, md: 6 }} alignItems="center" textAlign="center" sx={{ width: '100%' }}>
                    {/* Circular Logo Container */}
                    <Box
                        sx={{
                            width: { xs: 120, md: 160 },
                            height: { xs: 120, md: 160 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            bgcolor: 'background.paper',
                            boxShadow: (theme) => theme.palette.mode === 'light'
                                ? '0 20px 40px rgba(30, 79, 177, 0.18)'
                                : '0 20px 40px rgba(0, 0, 0, 0.5)',
                            p: 0,
                            overflow: 'hidden',
                            border: '4px solid',
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
                                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
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
                                mb: 4,
                                fontWeight: 400,
                                maxWidth: '600px',
                                mx: 'auto',
                                lineHeight: 1.4,
                                fontSize: { xs: '1rem', md: '1.25rem' }
                            }}
                        >
                            Elevating your workplace productivity with professional, real-time IT support and ticket management.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
                            {user ? (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    component={RouterLink}
                                    to={ROLE_ROUTES[user.role] || '/profile'}
                                    sx={{
                                        px: 4,
                                        py: 2,
                                        fontSize: '1.1rem',
                                        borderRadius: '12px',
                                        boxShadow: (theme) => theme.palette.mode === 'light'
                                            ? '0 10px 20px rgba(30, 79, 177, 0.25)'
                                            : '0 10px 20px rgba(0, 0, 0, 0.4)',
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
                                            py: 2,
                                            fontSize: '1.1rem',
                                            borderRadius: '12px',
                                            boxShadow: (theme) => theme.palette.mode === 'light'
                                                ? '0 10px 20px rgba(30, 79, 177, 0.25)'
                                                : '0 10px 20px rgba(0, 0, 0, 0.4)',
                                            textTransform: 'none',
                                            fontWeight: 700
                                        }}
                                    >
                                        Member Login
                                    </Button>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* Compact Feature Highlights */}
                    <Grid container spacing={2} sx={{ width: '100%', maxWidth: '800px' }}>
                        {[
                            { title: 'Fast Response', desc: 'Industry-leading resolution times' },
                            { title: 'Real-time Updates', desc: 'Instant notifications and tracking' },
                            { title: 'Role-Based Access', desc: 'Secure environment for all tasks' }
                        ].map((item, i) => (
                            <Grid item xs={12} sm={4} key={i}>
                                <Box sx={{
                                    p: 2,
                                    height: '100%',
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    opacity: 0.9,
                                    backdropFilter: 'blur(15px)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: '0 15px 30px rgba(0,0,0,0.05)'
                                    }
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5, fontSize: '1rem' }}>{item.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>{item.desc}</Typography>
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
