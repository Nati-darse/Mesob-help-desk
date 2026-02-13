import { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Grid, Chip, Divider, TextField, Button, MenuItem, List, ListItem, ListItemText, Avatar, Alert, Rating } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import FeedbackForm from '../components/FeedbackForm';
import { ROLES } from '../../../constants/roles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getStatusColor, getReviewStatusColor } from '../../../utils/ticketStatus';

const priorityColors = { Low: 'success', Medium: 'info', High: 'primary', Critical: 'error' };
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TicketDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [ticket, setTicket] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState('');
    const [selectedTech, setSelectedTech] = useState('');
    const [error, setError] = useState('');
    const qc = useQueryClient();

    useEffect(() => {
        fetchTicket();
        if (user?.role === ROLES.TEAM_LEAD || user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.SYSTEM_ADMIN) {
            fetchTechnicians();
        }
    }, [id]);

    const fetchTicket = async () => {
        try {
            const res = await axios.get(`/api/tickets/${id}`);
            setTicket(res.data);
            setStatus(res.data.status);
        } catch (err) {
            setError('Failed to fetch ticket details');
        }
    };

    const fetchTechnicians = async () => {
        try {
            const res = await axios.get('/api/users/technicians');
            setTechnicians(res.data);
        } catch (err) {
            console.error('Failed to fetch technicians');
        }
    };

    const handleAssign = async () => {
        try {
            await axios.put(`/api/tickets/${id}/assign`, { technicianId: selectedTech });
            fetchTicket();
        } catch (err) {
            setError('Failed to assign technician');
        }
    };

    const updateStatusMutation = useMutation({
        mutationFn: async (newStatus) => {
            const res = await axios.put(`/api/tickets/${id}`, { status: newStatus });
            return res.data;
        },
        onMutate: async (newStatus) => {
            setTicket(prev => (prev ? { ...prev, status: newStatus } : prev));
            await qc.cancelQueries({ queryKey: ['tickets'] });
            const previous = qc.getQueryData(['tickets']);
            qc.setQueryData(['tickets'], (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map(t => (t._id === id ? { ...t, status: newStatus } : t));
            });
            return { previous };
        },
        onError: (err, newStatus, context) => {
            if (context && context.previous) qc.setQueryData(['tickets'], context.previous);
            setError('Failed to update status');
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['tickets'] });
            fetchTicket();
        }
    });

    const handleStatusUpdate = () => {
        updateStatusMutation.mutate(status);
    };

    const handleResolve = async () => {
        try {
            await axios.put(`/api/tickets/${id}/resolve`);
            fetchTicket();
        } catch (err) {
            setError('Failed to resolve ticket');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await axios.post(`/api/tickets/${id}/comment`, { text: newComment });
            setNewComment('');
            fetchTicket();
        } catch (err) {
            setError('Failed to add comment');
        }
    };

    if (!ticket) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Main Ticket Info */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'start', sm: 'center' }, gap: 2, mb: 2 }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', md: '2.125rem' } }}>{ticket.title}</Typography>
                            <Chip label={ticket.status} color={getStatusColor(ticket.status)} />
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                            <Chip label={ticket.category} variant="outlined" />
                            <Chip label={ticket.priority} color={priorityColors[ticket.priority]} variant="outlined" />
                        </Box>

                        <Typography variant="h6" gutterBottom>Description</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>
                            {ticket.description}
                        </Typography>

                        {ticket.attachments && ticket.attachments.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" gutterBottom>Attachments</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {ticket.attachments.map((file, index) => {
                                        const filePath = typeof file === 'string'
                                            ? file
                                            : (file.path || file.filename);
                                        const href = filePath.startsWith('http')
                                            ? filePath
                                            : `${API_BASE_URL.replace(/\/$/, '')}/${filePath.replace(/^\/+/, '')}`;
                                        const name = typeof file === 'string' ? `File ${index + 1}` : (file.filename || `File ${index + 1}`);
                                        const type = typeof file === 'string' ? '' : (file.mimetype || '');
                                        const isImage = type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath);

                                        if (isImage) {
                                            return (
                                                <Box key={index} sx={{ width: 160 }}>
                                                    <Box
                                                        component="a"
                                                        href={href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        sx={{
                                                            display: 'block',
                                                            borderRadius: 2,
                                                            overflow: 'hidden',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            bgcolor: 'background.paper'
                                                        }}
                                                    >
                                                        <Box
                                                            component="img"
                                                            src={href}
                                                            alt={name}
                                                            sx={{ display: 'block', width: '100%', height: 120, objectFit: 'cover' }}
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} noWrap>
                                                        {name}
                                                    </Typography>
                                                </Box>
                                            );
                                        }

                                        return (
                                            <Button
                                                key={index}
                                                variant="outlined"
                                                size="small"
                                                href={href}
                                                target="_blank"
                                                sx={{ textTransform: 'none' }}
                                            >
                                                {name}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        <Divider sx={{ my: 4 }} />

                        {/* Comment Section */}
                        <Typography variant="h6" gutterBottom>Communication & Updates</Typography>
                        <List sx={{ mb: 3 }}>
                            {ticket.comments.map((comment, index) => (
                                <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main', fontSize: '14px' }}>
                                        {comment.user?.name?.charAt(0)}
                                    </Avatar>
                                    <ListItemText
                                        primary={comment.user?.name || 'User'}
                                        secondary={
                                            <Box component="span">
                                                <Typography variant="body2" color="text.primary">{comment.text}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>

                        <form onSubmit={handleAddComment}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Add a comment or update..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                variant="outlined"
                            />
                            <Button type="submit" variant="contained" sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}>
                                Post Comment
                            </Button>
                        </form>

                        {/* Feedback Section (Requester only) */}
                        {ticket.status === 'Resolved' && user?._id === ticket.requester._id && (
                            <FeedbackForm ticketId={id} onResolved={fetchTicket} />
                        )}

                        {/* View Feedback (If Closed) */}
                        {ticket.status === 'Closed' && ticket.rating && (
                            <Box sx={{ mt: 4, p: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" color="primary.main" gutterBottom>Resolution Feedback</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                    <Rating value={ticket.rating} readOnly />
                                    <Typography variant="body2" sx={{ ml: 1 }}>({ticket.rating}/5)</Typography>
                                </Box>
                                {ticket.feedback && (
                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                        "{ticket.feedback}"
                                    </Typography>
                                    )}
                            </Box>
                        )}

                        {ticket.reviewStatus && ticket.reviewStatus !== 'None' && (
                            <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Review Status
                                </Typography>
                                <Chip
                                    label={ticket.reviewStatus}
                                    color={getReviewStatusColor(ticket.reviewStatus)}
                                    size="small"
                                />
                                {ticket.reviewNotes && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {ticket.reviewNotes}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Sidebar Actions */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>Lifecycle Management</Typography>

                        {/* Requester Info */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Requester</Typography>
                            <Typography variant="body1">{ticket.requester.name}</Typography>
                            <Typography variant="caption">{ticket.requester.department}</Typography>
                        </Box>

                        {/* Assignment (Team Lead/Admin) */}
                        {(user?.role === ROLES.TEAM_LEAD || user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.SYSTEM_ADMIN) && ticket.status === 'New' && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary">Assign Technician</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={selectedTech}
                                    onChange={(e) => setSelectedTech(e.target.value)}
                                    sx={{ mt: 1 }}
                                >
                                    {technicians.map((tech) => (
                                        <MenuItem key={tech._id} value={tech._id}>{tech.name}</MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    sx={{ mt: 1 }}
                                    onClick={handleAssign}
                                    disabled={!selectedTech}
                                >
                                    Assign
                                </Button>
                            </Box>
                        )}

                        {/* Status Update (Technician/Admin) */}
                        {(user?.role === ROLES.TECHNICIAN || user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.SYSTEM_ADMIN) && (ticket.status === 'Assigned' || ticket.status === 'In Progress') && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary">Update Status</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    sx={{ mt: 1, mb: 1 }}
                                >
                                    {['Assigned', 'In Progress'].map((s) => (
                                        <MenuItem key={s} value={s}>{s}</MenuItem>
                                    ))}
                                </TextField>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    sx={{ mb: 1 }}
                                    onClick={handleStatusUpdate}
                                >
                                    Update
                                </Button>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    onClick={handleResolve}
                                >
                                    Mark as Resolved
                                </Button>
                            </Box>
                        )}

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                            <Typography variant="body1">
                                {ticket.technician ? ticket.technician.name : 'Unassigned'}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default TicketDetails;
