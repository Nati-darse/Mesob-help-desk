import { Container, Paper, Typography, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { ROLES } from '../../../constants/roles';
import { getCompanyById } from '../../../utils/companies';
import TruncatedText from '../../../components/TruncatedText';
import React, { memo } from 'react';

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

const TicketRow = memo(({ ticket, user }) => {
    return (
        <TableRow hover>
            <TableCell sx={{ maxWidth: 200 }}>
                <TruncatedText
                    text={ticket.title}
                    variant="body1"
                    sx={{ fontWeight: 500 }}
                />
            </TableCell>
            {user?.role !== ROLES.EMPLOYEE && (
                <TableCell sx={{ maxWidth: 200 }}>
                    <TruncatedText
                        text={getCompanyById(ticket.companyId || 1).name}
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                    />
                </TableCell>
            )}
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
    );
});

const TicketList = () => {
    const { data: tickets = [], isLoading: loading, error } = useTickets();
    const { user } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Failed to fetch tickets. Please try again later.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Support Tickets
                </Typography>
                {user?.role === ROLES.EMPLOYEE && (
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

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
                <Table sx={{ minWidth: 700 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                            {user?.role !== ROLES.EMPLOYEE && <TableCell sx={{ fontWeight: 'bold' }}>Bureau</TableCell>}
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
                                <TicketRow key={ticket._id} ticket={ticket} user={user} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default TicketList;
