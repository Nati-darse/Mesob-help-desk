import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLES } from '../../../constants/roles';

const TechDashboard = () => {
    const { user } = useAuth();

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    Technician Workspace
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome{user ? `, ${user.name}` : ''}. Use this area to access and resolve your assigned tickets.
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/tickets"
                >
                    View All Tickets
                </Button>
                {user?.role === ROLES.TECHNICIAN && (
                    <Button
                        variant="outlined"
                        color="primary"
                        component={RouterLink}
                        to="/tech"
                    >
                        Refresh Dashboard
                    </Button>
                )}
            </Box>
        </Container>
    );
};

export default TechDashboard;

