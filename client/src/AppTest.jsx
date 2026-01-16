import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline, Typography } from '@mui/material';
import { getTheme } from './styles/theme';

const App = () => {
  const theme = getTheme('dark');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Mesob Help Desk - Test Mode
          </Typography>
          <Routes>
            <Route path="/" element={<Typography variant="h6">Home Page</Typography>} />
            <Route path="/tech" element={<Typography variant="h6">Technician Dashboard - Working!</Typography>} />
            <Route path="/login" element={<Typography variant="h6">Login Page</Typography>} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
