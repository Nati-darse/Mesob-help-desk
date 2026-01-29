import { createTheme } from '@mui/material/styles';

const BRAND_BLUE = '#1e4fb1';
const LIGHT_BLUE = '#e7f0ff';
const DARK_BLUE = '#0a192f'; // Premium Navy for Dark Mode
const ACCENT_BLUE = '#0061f2';

export const getTheme = (mode, isSystemAdmin = false, isSuperAdmin = false) => {
    // We use different blue accents to distinguish roles while maintaining brand unity
    const primaryColor = isSystemAdmin ? ACCENT_BLUE : (isSuperAdmin ? '#1976d2' : BRAND_BLUE);

    const baseTheme = {
        palette: {
            mode,
            primary: {
                main: primaryColor,
                light: LIGHT_BLUE,
                dark: '#153b8a',
                contrastText: '#ffffff',
            },
            secondary: {
                main: ACCENT_BLUE,
            },
            background: {
                default: mode === 'light' ? '#f8f9fa' : DARK_BLUE,
                paper: mode === 'light' ? '#ffffff' : '#112240',
            },
            text: {
                primary: mode === 'light' ? '#0a192f' : '#e6f1ff',
                secondary: mode === 'light' ? '#4a5568' : '#8892b0',
            },
        },
        typography: {
            fontFamily: '"Inter", "Noto Sans Ethiopic", "Nyala", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-0.02em' },
            h2: { fontWeight: 700, letterSpacing: '-0.01em' },
            h3: { fontWeight: 700 },
            button: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        padding: '8px 20px',
                    },
                    containedPrimary: {
                        boxShadow: '0 4px 14px 0 rgba(30, 79, 177, 0.39)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(30, 79, 177, 0.23)',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: mode === 'light'
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.18)',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? '#ffffff' : '#112240',
                        color: mode === 'light' ? '#0a192f' : '#ffffff',
                        boxShadow: 'none',
                        borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#1e293b'}`,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: mode === 'light' ? '#ffffff' : '#112240',
                        borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#1e293b'}`,
                    },
                },
            },
        },
    };

    return createTheme(baseTheme);
};

// For backward compatibility
const theme = getTheme('light');
export default theme;
