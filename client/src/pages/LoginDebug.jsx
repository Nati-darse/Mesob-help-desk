import { useState } from 'react';
import { Container, Paper, Button, Typography, Box, Alert, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

const testAccounts = [
    { email: 'sysadmin@mesob.com', password: 'sysadmin123', role: 'System Admin', path: '/sys-admin' },
    { email: 'admin@mesob.com', password: 'admin123', role: 'Super Admin', path: '/admin' },
    { email: 'tech@mesob.com', password: 'tech123', role: 'Technician', path: '/tech' },
    { email: 'lead@mesob.com', password: 'lead123', role: 'Team Lead', path: '/team-lead' },
    { email: 'ermias@eeu.com', password: 'emp123', role: 'Worker', path: '/portal' },
];

const LoginDebug = () => {
    const [status, setStatus] = useState('');
    const [testing, setTesting] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const testLogin = async (account) => {
        setTesting(true);
        setStatus(`Testing ${account.role}...`);
        
        try {
            const result = await login(account.email, account.password);
            
            if (result.success) {
                setStatus(`✅ ${account.role} login successful! Redirecting to ${account.path}...`);
                setTimeout(() => {
                    navigate(account.path, { replace: true });
                }, 1000);
            } else {
                setStatus(`❌ ${account.role} login failed: ${result.message}`);
            }
        } catch (error) {
            setStatus(`❌ Error: ${error.message}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    🧪 Login Debug Panel
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Test login functionality for all roles
                </Typography>

                {status && (
                    <Alert severity={status.includes('✅') ? 'success' : 'error'} sx={{ mb: 3 }}>
                        {status}
                    </Alert>
                )}

                {user && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Currently logged in as: <strong>{user.name}</strong> ({user.role})
                    </Alert>
                )}

                <Table>
                    <TableBody>
                        {testAccounts.map((account) => (
                            <TableRow key={account.email}>
                                <TableCell>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {account.role}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {account.email}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        → {account.path}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => testLogin(account)}
                                        disabled={testing}
                                    >
                                        Test Login
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                        💡 Tip: Open browser console (F12) to see detailed logs
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginDebug;
