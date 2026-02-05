import { createTheme } from '@mui/material/styles';

const BRAND_BLUE = '#1e4fb1';
const LIGHT_BLUE = '#e7f0ff';
const DARK_BLUE = '#0a192f'; // Premium Navy for Dark Mode
const ACCENT_BLUE = '#0061f2';

export const getTheme = (mode, isSystemAdmin = false, isSuperAdmin = false) => {
    // We use different blue accents to distinguish roles while maintaining brand unity
    const primaryColor = isSystemAdmin ? ACCENT_BLUE : (isSuperAdmin ? '#1976d2' : BRAND_BLUE);
    const isDark = mode === 'dark';

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
                default: isDark ? '#0b1220' : '#f8f9fa',
                paper: isDark ? '#0f1c33' : '#ffffff',
            },
            text: {
                primary: isDark ? '#e6f1ff' : '#0a192f',
                secondary: isDark ? '#9fb0c6' : '#4a5568',
            },
            divider: isDark ? '#1f2a44' : '#e2e8f0',
            action: {
                hover: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(2, 6, 23, 0.04)',
                selected: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(2, 6, 23, 0.08)',
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
                        boxShadow: isDark
                            ? '0 8px 18px 0 rgba(0, 0, 0, 0.45)'
                            : '0 4px 14px 0 rgba(30, 79, 177, 0.39)',
                        '&:hover': {
                            boxShadow: isDark
                                ? '0 10px 22px rgba(0, 0, 0, 0.5)'
                                : '0 6px 20px rgba(30, 79, 177, 0.23)',
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
                        backgroundColor: isDark ? '#0f1c33' : '#ffffff',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: isDark ? '#0f1c33' : '#ffffff',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDark ? '#0f1c33' : '#ffffff',
                        color: isDark ? '#e6f1ff' : '#0a192f',
                        boxShadow: 'none',
                        borderBottom: `1px solid ${isDark ? '#1f2a44' : '#e2e8f0'}`,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: isDark ? '#0f1c33' : '#ffffff',
                        borderRight: `1px solid ${isDark ? '#1f2a44' : '#e2e8f0'}`,
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        backgroundColor: isDark ? '#13223b' : '#f8f9fa',
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: isDark ? '#1f2a44' : '#e2e8f0',
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: isDark ? '#0f1c33' : '#ffffff',
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
