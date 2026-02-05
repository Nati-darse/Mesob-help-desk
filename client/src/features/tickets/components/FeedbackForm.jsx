import { useState } from 'react';
import { Box, Typography, Rating, TextField, Button, Paper, Alert } from '@mui/material';
import axios from 'axios';

const FeedbackForm = ({ ticketId, onResolved }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please provide a star rating');
            return;
        }
        setLoading(true);
        try {
            await axios.put(`/api/tickets/${ticketId}/rate`, { rating, feedback });
            onResolved();
        } catch (err) {
            setError('Failed to submit feedback');
        }
        setLoading(false);
    };

    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,79,177,0.12)' : '#f1f8ff', borderRadius: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom color="primary.main" sx={{ fontWeight: 'bold' }}>
                Rate our Service
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Your feedback helps us simplify IT support for everyone at Mesob.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2 }}>
                    <Typography component="legend">Service Quality</Typography>
                    <Rating
                        name="ticket-rating"
                        value={rating}
                        onChange={(event, newValue) => setRating(newValue)}
                        size="large"
                    />
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Additional comments (optional)"
                    placeholder="What could we improve?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2, bgcolor: 'background.paper' }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                >
                    Submit Feedback for Review
                </Button>
            </form>
        </Paper>
    );
};

export default FeedbackForm;
