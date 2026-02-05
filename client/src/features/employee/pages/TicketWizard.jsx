import { useState } from 'react';
import { Container, Typography, Box, Stepper, Step, StepLabel, Button, Paper, TextField, MenuItem, Stack, Grid, Card, CardActionArea, CardContent, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import {
    Computer as HardwareIcon,
    Terminal as SoftwareIcon,
    Lan as NetworkIcon,
    Business as BuildingIcon,
    ArrowBack as BackIcon,
    ArrowForward as NextIcon,
    CheckCircle as SubmitIcon
} from '@mui/icons-material';

const categories = [
    { id: 'Hardware', icon: <HardwareIcon sx={{ fontSize: 40 }} />, description: 'Laptops, Monitors, Printers, Peripherals' },
    { id: 'Software', icon: <SoftwareIcon sx={{ fontSize: 40 }} />, description: 'OS issues, App crashes, Licenses' },
    { id: 'Network', icon: <NetworkIcon sx={{ fontSize: 40 }} />, description: 'Wi-Fi, VPN, Internet connection' },
    { id: 'Building', icon: <BuildingIcon sx={{ fontSize: 40 }} />, description: 'Electricity, Furniture, AC, Access' },
];

const TicketWizard = () => {
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        buildingWing: '', // New field for multi-tenant building
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const steps = ['Select Category', 'Issue Details', 'Review & Submit'];

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                companyId: user?.companyId || 1 // Auto-tagging with company ID
            };
            await axios.post('/api/tickets', payload);
            navigate('/portal');
        } catch (err) {
            console.error('Failed to create ticket', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        {categories.map((cat) => (
                            <Grid item xs={12} sm={6} key={cat.id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        border: '2px solid',
                                        borderColor: formData.category === cat.id ? 'primary.main' : 'divider',
                                        bgcolor: formData.category === cat.id ? 'primary.50' : 'background.paper',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <CardActionArea onClick={() => { setFormData({ ...formData, category: cat.id }); handleNext(); }} sx={{ p: 2 }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Box sx={{ color: formData.category === cat.id ? 'primary.main' : 'text.secondary', mb: 2 }}>
                                                {cat.icon}
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{cat.id}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {cat.description}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );
            case 1:
                return (
                    <Stack spacing={4}>
                        <TextField
                            fullWidth
                            label="Brief Title"
                            placeholder="e.g. My laptop screen is flickering"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            variant="outlined"
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={5}
                            label="Detailed Description"
                            placeholder="Please provide as much detail as possible..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            variant="outlined"
                        />
                        <TextField
                            fullWidth
                            label="Building Wing / Floor / Office"
                            placeholder="e.g. Wing A, 4th Floor, Office 412"
                            value={formData.buildingWing || ''}
                            onChange={(e) => setFormData({ ...formData, buildingWing: e.target.value })}
                            variant="outlined"
                        />
                        <TextField
                            select
                            fullWidth
                            label="Priority Level"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                                <MenuItem key={p} value={p}>{p}</MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                );
            case 2:
                return (
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, bgcolor: 'action.hover', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Review Your Request</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={4}><Typography color="text.secondary">Category:</Typography></Grid>
                            <Grid item xs={8}><Typography sx={{ fontWeight: 600 }}>{formData.category}</Typography></Grid>
                            <Grid item xs={4}><Typography color="text.secondary">Priority:</Typography></Grid>
                            <Grid item xs={8}><Typography sx={{ fontWeight: 600 }}>{formData.priority}</Typography></Grid>
                            <Grid item xs={4}><Typography color="text.secondary">Location:</Typography></Grid>
                            <Grid item xs={8}><Typography sx={{ fontWeight: 600 }}>{formData.buildingWing || 'Not specified'}</Typography></Grid>
                            <Grid item xs={4}><Typography color="text.secondary">Title:</Typography></Grid>
                            <Grid item xs={8}><Typography sx={{ fontWeight: 600 }}>{formData.title}</Typography></Grid>
                        </Grid>
                        <Box sx={{ mt: 3 }}>
                            <Typography color="text.secondary" gutterBottom>Description:</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                                {formData.description}
                            </Typography>
                        </Box>
                    </Paper>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, fontSize: { xs: '2rem', sm: '3rem' } }}>
                    Report an Issue
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Follow the steps to get help from our IT team.
                </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 8, flexWrap: 'wrap' }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ minHeight: 400 }}>
                {renderStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, mt: 8 }}>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                    sx={{ px: 4, width: { xs: '100%', sm: 'auto' } }}
                >
                    Back
                </Button>
                <Box>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSubmit}
                            disabled={loading || !formData.title || !formData.description}
                            startIcon={<SubmitIcon />}
                            sx={{ px: 6, borderRadius: 3, width: { xs: '100%', sm: 'auto' } }}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    ) : activeStep !== 0 && (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!formData.category && activeStep === 0}
                            endIcon={<NextIcon />}
                            sx={{ px: 6, borderRadius: 3, width: { xs: '100%', sm: 'auto' } }}
                        >
                            Continue
                        </Button>
                    )}
                </Box>
            </Box>
        </Container>
    );
};

export default TicketWizard;
