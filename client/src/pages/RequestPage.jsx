import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Grid, TextField, Button, Box, Card, CardContent,
    FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Chip,
    Stack, Avatar, Badge, Divider, Stepper, Step, StepLabel
} from '@mui/material';
import {
    Send as SendIcon,
    Assignment as RequestIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    PriorityHigh as PriorityIcon,
    Category as CategoryIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../features/auth/context/AuthContext';
import { getCompanyById } from '../utils/companies';
import axios from 'axios';

const RequestPage = () => {
    const { user } = useAuth();
    const company = getCompanyById(user?.companyId || 1);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'General',
        priority: 'Medium',
        floor: '',
        buildingWing: '',
        contactPhone: '',
        contactEmail: user?.email || ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [ticketId, setTicketId] = useState(null);
    const [activeStep, setActiveStep] = useState(0);

    const categories = [
        'Software',
        'Hardware', 
        'Network',
        'Account',
        'Building',
        'Other'
    ];

    const priorities = [
        { value: 'Low', label: 'Low - Can wait', color: 'success' },
        { value: 'Medium', label: 'Medium - Normal priority', color: 'info' },
        { value: 'High', label: 'High - Urgent', color: 'warning' },
        { value: 'Critical', label: 'Critical - Emergency', color: 'error' }
    ];

    const steps = ['Request Details', 'Location & Contact', 'Review & Submit'];

    useEffect(() => {
        if (submitted) {
            setActiveStep(2);
        }
    }, [submitted]);

    const handleInputChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/api/tickets', {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                priority: formData.priority,
                buildingWing: formData.buildingWing || `Floor: ${formData.floor}`,
                companyId: user.companyId
            });

            setTicketId(response.data._id);
            setSubmitted(true);
            setActiveStep(2);
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                category: 'General',
                priority: 'Medium',
                floor: '',
                buildingWing: '',
                contactPhone: '',
                contactEmail: user?.email || ''
            });
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPriorityColor = (priorityValue) => {
        const priority = priorities.find(p => p.value === priorityValue);
        return priority ? priority.color : 'default';
    };

    if (submitted) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 2 }}>
                        Request Submitted Successfully!
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        Your request has been received and is being processed.
                    </Typography>
                    <Alert severity="success" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Request ID:</strong> {ticketId}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Status:</strong> New - Awaiting assignment
                        </Typography>
                    </Alert>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        You will receive updates via email as your request progresses.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                            setSubmitted(false);
                            setActiveStep(0);
                            setTicketId(null);
                        }}
                        startIcon={<RequestIcon />}
                    >
                        Submit Another Request
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Avatar sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: 'primary.main', 
                    mx: 'auto', 
                    mb: 2 
                }}>
                    <RequestIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                    Submit Support Request
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    Get help from our support team quickly and easily
                </Typography>
                <Chip 
                    label={`${company.name} - ${user?.name || 'User'}`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                />
            </Box>

            {/* Progress Stepper */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            <Grid container spacing={4}>
                {/* Request Form */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {/* Request Details Section */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon color="primary" />
                                        Request Details
                                    </Typography>
                                    <Divider sx={{ mb: 3 }} />
                                    
                                    <TextField
                                        fullWidth
                                        label="What do you need help with?"
                                        placeholder="Brief description of your issue or request"
                                        value={formData.title}
                                        onChange={handleInputChange('title')}
                                        required
                                        sx={{ mb: 2 }}
                                    />

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            value={formData.category}
                                            label="Category"
                                            onChange={handleInputChange('category')}
                                        >
                                            {categories.map((cat) => (
                                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Priority</InputLabel>
                                        <Select
                                            value={formData.priority}
                                            label="Priority"
                                            onChange={handleInputChange('priority')}
                                        >
                                            {priorities.map((priority) => (
                                                <MenuItem key={priority.value} value={priority.value}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PriorityIcon sx={{ color: `${priority.color}.main`, fontSize: 16 }} />
                                                        {priority.label}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Detailed Description"
                                        placeholder="Please provide more details about your request. Include any error messages, steps to reproduce, or specific requirements."
                                        value={formData.description}
                                        onChange={handleInputChange('description')}
                                        required
                                    />
                                </Box>

                                {/* Location & Contact Section */}
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationIcon color="primary" />
                                            Location & Contact Information
                                        </Typography>
                                        <Divider sx={{ mb: 3 }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Floor/Room Number"
                                                    placeholder="e.g., 3rd Floor, Room 301"
                                                    value={formData.floor}
                                                    onChange={handleInputChange('floor')}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Building/Wing"
                                                    placeholder="e.g., Main Building, East Wing"
                                                    value={formData.buildingWing}
                                                    onChange={handleInputChange('buildingWing')}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Contact Phone"
                                                    placeholder="Your phone number for follow-up"
                                                    value={formData.contactPhone}
                                                    onChange={handleInputChange('contactPhone')}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Contact Email"
                                                    type="email"
                                                    value={formData.contactEmail}
                                                    onChange={handleInputChange('contactEmail')}
                                                    required
                                                />
                                            </Grid>
                                        </Grid>
                                </Box>

                                {/* Submit Button */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={isSubmitting || !formData.title || !formData.description}
                                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                                        sx={{ 
                                            px: 6, 
                                            py: 1.5, 
                                            borderRadius: 3, 
                                            fontWeight: 'bold',
                                            boxShadow: 2
                                        }}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    </Paper>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} lg={4}>
                    <Stack spacing={3}>
                        {/* User Info Card */}
                        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="primary" />
                                    Your Information
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        {user?.name?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {user?.name || 'User'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {user?.role || 'Employee'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                        {company.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                        {company.location || 'Office Location'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Quick Tips */}
                        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    💡 Quick Tips
                                </Typography>
                                <Box sx={{ '& > *': { mb: 1 } }}>
                                    <Typography variant="body2">
                                        • Be specific in your description
                                    </Typography>
                                    <Typography variant="body2">
                                        • Include error messages if any
                                    </Typography>
                                    <Typography variant="body2">
                                        • Set appropriate priority level
                                    </Typography>
                                    <Typography variant="body2">
                                        • Provide accurate contact info
                                    </Typography>
                                    <Typography variant="body2">
                                        • Include location details
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Priority Guide */}
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Priority Levels:
                            </Typography>
                            <Box sx={{ '& > *': { mb: 0.5 } }}>
                                <Typography variant="caption" display="block">
                                    🔴 Critical: System down, emergency
                                </Typography>
                                <Typography variant="caption" display="block">
                                    🟡 High: Major impact on work
                                </Typography>
                                <Typography variant="caption" display="block">
                                    🔵 Medium: Normal business issue
                                </Typography>
                                <Typography variant="caption" display="block">
                                    🟢 Low: Can wait, non-urgent
                                </Typography>
                            </Box>
                        </Alert>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default RequestPage;
