import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Tooltip, CircularProgress, Alert, Snackbar, useMediaQuery, useTheme, Rating
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getReviewStatusColor } from '../../../utils/ticketStatus';
import { formatCompanyLabel, getCompanyById } from '../../../utils/companies';

const TicketReviews = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewDialog, setReviewDialog] = useState({ open: false, ticket: null, action: null });
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchPendingReviews();
    }, []);

    const fetchPendingReviews = async () => {
        try {
            // Fetch tickets that are Resolved. Only those with reviewStatus 'Pending'
            // are actually ready for administrative review in the pro workflow.
            const res = await axios.get('/api/tickets?status=Resolved&reviewStatus=Pending');
            setTickets(res.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showNotification('Failed to load pending reviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (ticket, action) => {
        setReviewDialog({ open: true, ticket, action });
        setNotes('');
    };

    const submitReview = async () => {
        if (!reviewDialog.ticket || !reviewDialog.action) return;

        setSubmitting(true);
        try {
            await axios.put(`/api/tickets/${reviewDialog.ticket._id}/review`, {
                action: reviewDialog.action,
                notes: notes
            });

            showNotification(
                `Ticket ${reviewDialog.action === 'approve' ? 'Approved' : 'Rejected'} successfully`,
                'success'
            );

            setReviewDialog({ open: false, ticket: null, action: null });
            fetchPendingReviews(); // Refresh list
        } catch (error) {
            console.error('Review failed:', error);
            showNotification('Failed to submit review', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const getTicketCompanyLabel = (ticket) => formatCompanyLabel(getCompanyById(ticket.companyId));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    Ticket Resolution Reviews
                </Typography>
            </Box>

            {tickets.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <ApproveIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No tickets pending review.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Good job! All resolved tickets have been processed.
                    </Typography>
                </Paper>
            ) : isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tickets.map((ticket) => (
                        <Paper key={ticket._id} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {ticket.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                #{ticket._id.slice(-6)} • {getTicketCompanyLabel(ticket)}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <Chip
                                    label={ticket.reviewStatus || 'Pending'}
                                    color={getReviewStatusColor(ticket.reviewStatus || 'Pending')}
                                    size="small"
                                    variant="outlined"
                                />
                                <Chip label={ticket.technician?.name || 'Unknown'} size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {ticket.workLog?.[ticket.workLog?.length - 1]?.note || 'No notes provided'}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                                <Rating value={ticket.rating || 0} readOnly size="small" />
                                {ticket.feedback && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                        "{ticket.feedback}"
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleActionClick(ticket, 'reject')}
                                >
                                    Reject
                                </Button>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleActionClick(ticket, 'approve')}
                                >
                                    Approve
                                </Button>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 700 }}>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell>Ticket</TableCell>
                                <TableCell>Technician</TableCell>
                                <TableCell>Resolved At</TableCell>
                                <TableCell>Resolution Details</TableCell>
                                <TableCell>Requester Feedback</TableCell>
                                <TableCell>Review</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tickets.map((ticket) => (
                                <TableRow key={ticket._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {ticket.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            #{ticket._id.slice(-6)} • {getTicketCompanyLabel(ticket)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {ticket.technician?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(ticket.updatedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 300 }}>
                                        <Typography variant="body2" noWrap>
                                            {ticket.workLog?.[ticket.workLog?.length - 1]?.note || 'No notes provided'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 280 }}>
                                        <Rating value={ticket.rating || 0} readOnly size="small" />
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {ticket.feedback || 'No feedback provided'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ticket.reviewStatus || 'Pending'}
                                            color={getReviewStatusColor(ticket.reviewStatus || 'Pending')}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Reject & Send Back">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleActionClick(ticket, 'reject')}
                                                >
                                                    <RejectIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Approve & Close">
                                                <IconButton
                                                    color="success"
                                                    onClick={() => handleActionClick(ticket, 'approve')}
                                                >
                                                    <ApproveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Review Dialog */}
            <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ ...reviewDialog, open: false })}>
                <DialogTitle>
                    {reviewDialog.action === 'approve' ? 'Approve Resolution' : 'Reject Resolution'}
                </DialogTitle>
                <DialogContent sx={{ minWidth: { xs: 'auto', sm: 400 } }}>
                    {reviewDialog.ticket && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                Requester Feedback
                            </Typography>
                            <Rating value={reviewDialog.ticket.rating || 0} readOnly size="small" />
                            <Typography variant="body2" color="text.secondary">
                                {reviewDialog.ticket.feedback || 'No feedback provided'}
                            </Typography>
                        </Box>
                    )}
                    <Alert severity={reviewDialog.action === 'approve' ? 'success' : 'warning'} sx={{ mb: 2 }}>
                        {reviewDialog.action === 'approve'
                            ? 'This will close the ticket permanently.'
                            : 'This will reopen the ticket and send it back to the technician.'}
                    </Alert>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reviewer Notes"
                        fullWidth
                        multiline
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={reviewDialog.action === 'approve' ? 'Optional closing remarks...' : 'Reason for rejection (Required)...'}
                        required={reviewDialog.action === 'reject'}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>Cancel</Button>
                    <Button
                        onClick={submitReview}
                        variant="contained"
                        color={reviewDialog.action === 'approve' ? 'success' : 'error'}
                        disabled={submitting || (reviewDialog.action === 'reject' && !notes.trim())}
                    >
                        {submitting ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TicketReviews;
