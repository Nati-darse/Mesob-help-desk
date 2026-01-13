import { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const priorityColors = {
    Low: 'success',
    Medium: 'info',
    High: 'warning',
    Critical: 'error',
};

const statusColors = {
    New: 'primary',
    Assigned: 'secondary',
    'In Progress': 'info',
    Resolved: 'success',
    Closed: 'default',
};

const TicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await axios.get('/api/tickets');
                setTickets(res.data);
            } catch (error) {
                console.error('Failed to fetch tickets');
            }
            setLoading(false);
        };

        fetchTickets();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Support Tickets
                </Typography>
                {user?.role === 'Worker' && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        component={RouterLink}
                        to="/tickets/new"
                    >
                        New Ticket
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 700 }}>
                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Created</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No tickets found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((ticket) => (
                                <TableRow key={ticket._id} hover>
                                    <TableCell>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {ticket.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{ticket.category}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ticket.priority}
                                            color={priorityColors[ticket.priority]}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={ticket.status}
                                            color={statusColors[ticket.status]}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            component={RouterLink}
                                            to={`/tickets/${ticket._id}`}
                                            color="primary"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default TicketList;
