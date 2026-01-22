import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { ColorModeProvider, useColorMode } from './context/ColorModeContext';
import { getTheme } from './styles/theme';
import Navbar from './components/Navbar';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import TicketList from './features/tickets/pages/TicketList';
import CreateTicket from './features/tickets/pages/CreateTicket';
import TicketDetails from './features/tickets/pages/TicketDetails';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import MaintenancePage from './pages/MaintenancePage';

import { ROLES } from './constants/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import { SuperAdminDashboard } from './pages/Dashboards';
import BossDashboard from './features/admin/pages/BossDashboard';
import ManualAssignment from './features/admin/pages/ManualAssignment';
import CompanyDirectory from './features/admin/pages/CompanyDirectory';
import SysDashboard from './features/system-admin/pages/SysDashboard';
import SystemAdminLayout from './features/system-admin/layouts/SystemAdminLayout';
import CompanyRegistry from './features/system-admin/pages/CompanyRegistry';
import AuditLogs from './features/system-admin/pages/AuditLogs';
import GlobalSettings from './features/system-admin/pages/GlobalSettings';
import BroadcastCenter from './features/system-admin/pages/BroadcastCenter';
import TechDashboard from './features/technician/pages/TechDashboard';
import TicketAction from './features/technician/pages/ResolutionPage';
import UserDashboard from './features/employee/pages/UserDashboard';
import TicketWizard from './features/employee/pages/TicketWizard';
import UserTicketView from './features/employee/pages/UserTicketView';
import SuperAdminLayout from './features/admin/layouts/SuperAdminLayout';
import GlobalUserEditor from './features/system-admin/pages/GlobalUserEditor';
import Profile from './pages/Profile';
import TeamLeadDashboard from './features/employee/pages/TeamLeadDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false
    }
  }
});

const AppContent = () => {
  const { mode } = useColorMode();
  const { user } = useAuth();
  const isSystemAdmin = user?.role === ROLES.SYSTEM_ADMIN;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const theme = getTheme(mode, isSystemAdmin, isSuperAdmin);
  const qc = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    const s = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: { companyId: user.companyId },
      extraHeaders: { 'x-tenant-id': String(user.companyId || '') }
    });
    socketRef.current = s;
    s.emit('join_company', user.companyId);
    s.on('ticket_updated', (ticket) => {
      qc.setQueryData(['tickets'], (prev) => {
        if (!prev || !Array.isArray(prev)) return prev;
        return prev.map(t => (t._id === ticket._id ? { ...t, ...ticket } : t));
      });
    });
    s.on('ticket_created', (ticket) => {
      qc.setQueryData(['tickets'], (prev) => {
        if (!prev || !Array.isArray(prev)) return prev;
        return [ticket, ...prev];
      });
    });

    s.on('broadcast_message', (notification) => {
      // Filter if relevant to me
      let isRelevant = false;
      if (notification.targetType === 'all') isRelevant = true;
      if (notification.targetType === 'company' && String(user.companyId) === String(notification.targetValue)) isRelevant = true;
      if (notification.targetType === 'role' && user.role === notification.targetValue) isRelevant = true;

      if (isRelevant) {
        qc.setQueryData(['notifications'], (prev) => {
          const list = Array.isArray(prev) ? prev : [];
          // data might come from API with _id, ensure structure
          return [notification, ...list];
        });
      }
    });
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user, qc]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/redirect" element={<RoleBasedRedirect />} />
              <Route path="/maintenance" element={<MaintenancePage />} />

              {/* System Admin Routes */}
              {/* System Admin Routes (God Mode) */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]} />}>
                <Route element={<SystemAdminLayout />}>
                  <Route path="/sys-admin" element={<SysDashboard />} />
                  <Route path="/sys-admin/companies" element={<CompanyRegistry />} />
                  <Route path="/sys-admin/users" element={<GlobalUserEditor />} />
                  <Route path="/sys-admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/sys-admin/settings" element={<GlobalSettings />} />
                  <Route path="/sys-admin/broadcast" element={<BroadcastCenter />} />
                </Route>
              </Route>

              {/* Super Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                <Route element={<SuperAdminLayout />}>
                  <Route path="/admin" element={<SuperAdminDashboard />} />
                  <Route path="/admin/dashboard" element={<BossDashboard />} />
                  <Route path="/admin/assign" element={<ManualAssignment />} />
                  <Route path="/admin/companies" element={<CompanyDirectory />} />
                  <Route path="/admin/users" element={<GlobalUserEditor />} />
                  <Route path="/admin/broadcast" element={<BroadcastCenter />} />
                  <Route path="/admin/settings" element={<GlobalSettings />} />
                </Route>
              </Route>

              {/* Team Lead Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.TEAM_LEAD]} />}>
                <Route path="/team-lead" element={<TeamLeadDashboard />} />
              </Route>

              {/* Technician Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]} />}>
                <Route path="/tech" element={<TechDashboard />} />
                <Route path="/tech/tickets/:id" element={<TicketAction />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
                <Route path="/portal" element={<UserDashboard />} />
                <Route path="/portal/new-ticket" element={<TicketWizard />} />
                <Route path="/portal/tickets/:id" element={<UserTicketView />} />
              </Route>

              {/* Legacy/General Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tickets" element={<TicketList />} />
                <Route path="/tickets/new" element={<CreateTicket />} />
                <Route path="/tickets/:id" element={<TicketDetails />} />
              </Route>
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  );
}

export default App;
