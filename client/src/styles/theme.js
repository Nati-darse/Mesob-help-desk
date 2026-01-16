import { createTheme } from '@mui/material/styles';

const MESOB_GOLD = '#FFD700';
const PREMIUM_NAVY = '#0a192f';
const SUPER_ADMIN_BLUE = '#1976d2';

export const getTheme = (mode, isSystemAdmin = false, isSuperAdmin = false) => {
    const baseTheme = {
        palette: {
            mode,
            primary: {
                main: isSystemAdmin ? MESOB_GOLD : (isSuperAdmin ? SUPER_ADMIN_BLUE : '#1e4fb1'), // Gold for System Admin, Blue for Super Admin
                contrastText: isSystemAdmin ? '#000000' : '#ffffff',
            },
            secondary: {
                main: mode === 'light' ? '#000000' : '#ffffff',
            },
            background: {
                default: mode === 'light' ? '#ffffff' : PREMIUM_NAVY, // Premium Navy Dark
                paper: mode === 'light' ? '#ffffff' : '#112240', // Slightly lighter navy
            },
            text: {
                primary: mode === 'light' ? '#000000' : '#e6f1ff',
                secondary: mode === 'light' ? '#333333' : '#8892b0',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700 },
            h2: { fontWeight: 700 },
            button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
                        color: mode === 'light' ? '#000000' : '#ffffff',
                        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
        },
    };

    // Add System Admin specific overrides
    if (isSystemAdmin) {
        baseTheme.components = {
            ...baseTheme.components,
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderLeft: `3px solid ${MESOB_GOLD} !important`,
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        borderColor: MESOB_GOLD,
                        borderWidth: 2,
                        borderStyle: 'solid',
                    },
                },
            },
        };
    }

    // Add Super Admin specific overrides
    if (isSuperAdmin) {
        baseTheme.components = {
            ...baseTheme.components,
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderLeft: `3px solid ${SUPER_ADMIN_BLUE} !important`,
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        borderColor: SUPER_ADMIN_BLUE,
                        borderWidth: 2,
                        borderStyle: 'solid',
                    },
                },
            },
        };
    }

    return createTheme(baseTheme);
};

// For backward compatibility until App.jsx is updated
const theme = getTheme('light');
export default theme;
