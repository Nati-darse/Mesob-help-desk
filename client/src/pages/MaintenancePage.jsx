import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { Engineering as EngineeringIcon } from '@mui/icons-material';

const MaintenancePage = () => {
    return (
        <Container maxWidth="md" sx={{ mt: { xs: 6, md: 10 }, textAlign: 'center' }}>
            <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
                <Box display="flex" justifyContent="center" mb={3}>
                    <EngineeringIcon sx={{ fontSize: { xs: 56, sm: 80 }, color: 'primary.main' }} />
                </Box>
                <Typography variant="h3" gutterBottom color="text.primary" fontWeight="bold" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
                    Under Maintenance
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    We are currently performing scheduled maintenance to improve our services.
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Please check back soon. Thank you for your patience!
                </Typography>
            </Paper>
        </Container>
    );
};

export default MaintenancePage;
