import { FormControlLabel, Switch, Typography, Box } from '@mui/material';
import { useAuth } from '../features/auth/context/AuthContext';
import { ROLES } from '../constants/roles';

/**
 * Reusable availability toggle component for technicians
 * Shows online/offline status and allows toggling availability
 */
const AvailabilityToggle = ({ variant = 'inline', size = 'small', sx = {} }) => {
    const { user, updateAvailability } = useAuth();

    // Only show for Technician role
    if (user?.role !== ROLES.TECHNICIAN) {
        return null;
    }

    const handleToggle = (e) => {
        updateAvailability(e.target.checked);
    };

    const isAvailable = user.isAvailable !== false;

    if (variant === 'vertical') {
        // Vertical layout for sidebar layouts
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, ...sx }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Availability
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isAvailable}
                            onChange={handleToggle}
                            color="success"
                            size={size}
                        />
                    }
                    label={
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                color: isAvailable ? 'success.main' : 'text.secondary'
                            }}
                        >
                            {isAvailable ? 'ONLINE' : 'OFFLINE'}
                        </Typography>
                    }
                    labelPlacement="bottom"
                />
            </Box>
        );
    }

    // Default inline layout
    return (
        <FormControlLabel
            control={
                <Switch
                    checked={isAvailable}
                    onChange={handleToggle}
                    color="success"
                    size={size}
                />
            }
            label={
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 700,
                        color: isAvailable ? 'success.main' : 'text.secondary'
                    }}
                >
                    {isAvailable ? 'ONLINE' : 'OFFLINE'}
                </Typography>
            }
            sx={{ mr: 2, ...sx }}
        />
    );
};

export default AvailabilityToggle;
