import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline, Typography, Container, Grid, Card, CardContent, 
    Button, Chip, Avatar, Tabs, Tab, Paper, TextField, Select, MenuItem, 
    FormControl, InputLabel, IconButton, Tooltip, LinearProgress, Divider } from '@mui/material';
import { 
    Assignment as TaskIcon, Schedule as PendingIcon, CheckCircle as ResolvedIcon,
    Search as SearchIcon, Build as BuildIcon, Warning as WarningIcon, Circle as StatusIcon
} from '@mui/icons-material';
import { getTheme } from './styles/theme';
import TechDashboard from './features/technician/pages/TechDashboard';
import Login from './features/auth/pages/Login';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { ROLES } from './constants/roles';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent = () => {
  const { mode } = useColorMode();
  const { user } = useAuth();
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Container maxWidth="xl">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Technician Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]} />}>
                <Route path="/tech" element={<TechDashboard />} />
              </Route>
              
              {/* Default Route */}
              <Route path="/" element={<Typography variant="h4">Welcome to Mesob Help Desk</Typography>} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
