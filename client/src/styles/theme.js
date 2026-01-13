import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1e4fb1', // Mesob Brand Blue
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#000000', // Black for primary text accents
        },
        background: {
            default: '#ffffff', // White background
            paper: '#ffffff',
        },
        text: {
            primary: '#000000', // Black text
            secondary: '#333333',
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
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
                },
            },
        },
    },
});

export default theme;
