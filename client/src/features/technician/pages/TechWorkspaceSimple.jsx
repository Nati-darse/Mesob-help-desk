import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Box, Grid, Card, CardContent, Chip, Avatar, 
    Button, IconButton, Tooltip, Badge, LinearProgress, Paper, Tabs, Tab,
    List, ListItem, ListItemText, ListItemIcon, Divider, TextField, Select, MenuItem,
    FormControl, InputLabel, Switch, FormControlLabel
} from '@mui/material';
import {
    Assignment as TaskIcon,
    Schedule as PendingIcon,
    CheckCircle as ResolvedIcon,
    Search as SearchIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Build as BuildIcon,
    Warning as WarningIcon,
    Circle as StatusIcon,
    Work as WorkIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import axios from 'axios';

const TechWorkspace = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dutyStatus, setDutyStatus] = useState('Active');

    useEffect(() => {
        fetchAssignedTickets();
    }, []);

    const fetchAssignedTickets = async () => {
        try {
            const res = await axios.get('/api/technician/assigned');
            setTickets(res.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Typography>Loading workspace...</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                Tech Workspace - Mission Control
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Welcome {user?.name || 'Technician'} - Your workspace is loading...
            </Typography>
        </Container>
    );
};

export default TechWorkspace;
