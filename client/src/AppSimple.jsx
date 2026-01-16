import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './styles/theme';
import TechDashboard from './features/technician/pages/TechDashboard';

const App = () => {
  const theme = getTheme('dark');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ p: 4 }}>
          <Routes>
            <Route path="/" element={<div><h1>Home</h1><p>Basic routing works</p></div>} />
            <Route path="/tech" element={<TechDashboard />} />
            <Route path="/login" element={<div><h1>Login</h1><p>Login page placeholder</p></div>} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
