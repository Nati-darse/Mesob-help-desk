import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, MenuItem, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';

const categories = ['Software', 'Hardware', 'Network', 'Account', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

const CreateTicket = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        buildingWing: '',
    });
    const { user } = useAuth();
    const [attachments, setAttachments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('priority', formData.priority);
        formDataToSend.append('buildingWing', formData.buildingWing);
        formDataToSend.append('companyId', user?.companyId || 1);

        for (let i = 0; i < attachments.length; i++) {
            formDataToSend.append('attachments', attachments[i]);
        }

        try {
            await axios.post('/api/tickets', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setTimeout(() => navigate('/tickets'), 2000);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create ticket');
        }
        setLoading(false);
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={0} sx={{ p: 4, border: '1px solid #eee', borderRadius: 2 }}>
                <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Create New Support Ticket
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                    Please provide detailed information about your issue so we can assist you better.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>Ticket created successfully! Redirecting...</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Ticket Title"
                        name="title"
                        variant="outlined"
                        margin="normal"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Cannot access email"
                    />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 1 }}>
                        <TextField
                            fullWidth
                            select
                            label="Category"
                            name="category"
                            variant="outlined"
                            required
                            value={formData.category}
                            onChange={handleChange}
                        >
                            {categories.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            select
                            label="Priority"
                            name="priority"
                            variant="outlined"
                            required
                            value={formData.priority}
                            onChange={handleChange}
                        >
                            {priorities.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <TextField
                        fullWidth
                        label="Building Wing / Floor / Office"
                        name="buildingWing"
                        variant="outlined"
                        margin="normal"
                        value={formData.buildingWing}
                        onChange={handleChange}
                        placeholder="e.g. Wing A, 4th Floor, Office 412"
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        variant="outlined"
                        margin="normal"
                        required
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Please describe the problem in detail..."
                    />

                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                            <Typography variant="body2" gutterBottom>Attachments (optional)</Typography>
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setAttachments(e.target.files)}
                                style={{ padding: '8px 0' }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" onClick={() => navigate('/tickets')}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                                sx={{ px: 4 }}
                            >
                                {loading ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
};

export default CreateTicket;
