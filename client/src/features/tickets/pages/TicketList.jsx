import { Container, Paper, Typography, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useTickets } from '../hooks/useTickets';
import { ROLES } from '../../../constants/roles';
import { getCompanyById } from '../../../utils/companies';
import TruncatedText from '../../../components/TruncatedText';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const priorityColors = {
    Low: 'success',
    Medium: 'info',
    High: 'primary',
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
                <TableCell sx={{ maxWidth: 200, display: { xs: 'none', sm: 'table-cell' } }}>
                    <TruncatedText
                        text={getCompanyById(ticket.companyId || 1).name}
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                    />
                </TableCell>
            )}
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{ticket.category}</TableCell>
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
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
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
    const { t } = useTranslation();

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
                <Alert severity="error">{t('ticketList.failedToFetch')}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {t('ticketList.supportTickets')}
                </Typography>
                {user?.role === ROLES.EMPLOYEE && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        component={RouterLink}
                        to="/tickets/new"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        {t('ticketList.newTicket')}
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('ticketList.title')}</TableCell>
                            {user?.role !== ROLES.EMPLOYEE && <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>{t('ticketList.bureau')}</TableCell>}
                            <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>{t('ticketList.category')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('ticketList.priority')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{t('ticketList.status')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>{t('ticketList.created')}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">{t('ticketList.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={user?.role !== ROLES.EMPLOYEE ? 7 : 6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">{t('ticketList.noTicketsFound')}</Typography>
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
