import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: { xs: 8, md: 15 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: { xs: 3, sm: 4 },
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
            >
                <SecurityIcon sx={{ fontSize: { xs: 56, sm: 80 }, color: 'error.main', mb: 2 }} />
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '2rem', sm: '3rem' } }}>
                    Access Denied
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    You do not have the necessary permissions to access this page. Please contact your administrator if you believe this is an error.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/')}
                    sx={{ px: 4, py: 1.5, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                    Return Home
                </Button>
            </Box>
        </Container>
    );
};

export default Unauthorized;
