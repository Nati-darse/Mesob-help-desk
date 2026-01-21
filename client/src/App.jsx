import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { ColorModeProvider, useColorMode } from './context/ColorModeContext';
import { getTheme } from './styles/theme';
import Navbar from './components/Navbar';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Landing from './pages/Landing';
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
import MasterUserTable from './features/system-admin/pages/MasterUserTable';
import AuditLogs from './features/system-admin/pages/AuditLogs';
import GlobalSettings from './features/system-admin/pages/GlobalSettings';
import BroadcastCenter from './features/system-admin/pages/BroadcastCenter';
import TechDashboard from './features/technician/pages/TechDashboard';
import ResolutionPage from './features/technician/pages/ResolutionPage';
import UserDashboard from './features/employee/pages/UserDashboard';
import TicketWizard from './features/employee/pages/TicketWizard';
import UserTicketView from './features/employee/pages/UserTicketView';
import GlobalDashboard from './features/system-admin/pages/GlobalDashboard';
import SuperAdminLayout from './features/admin/layouts/SuperAdminLayout';
// Adding System Admin pages back carefully
import CrossTenantAnalytics from './features/system-admin/pages/CrossTenantAnalytics';
import GlobalTicketSearch from './features/system-admin/pages/GlobalTicketSearch';
import BulkDataCleanup from './features/system-admin/pages/BulkDataCleanup';
import AccountManagement from './features/system-admin/pages/AccountManagement';

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
      transports: ['websocket', 'polling'], // Allow fallback to polling if websocket fails
      auth: { companyId: user.companyId },
      extraHeaders: { 'x-tenant-id': String(user.companyId || '') },
      timeout: 20000, // 20 second timeout
      forceNew: true // Force new connection
    });
    socketRef.current = s;
    
    // Add error handling for Socket.io connection
    s.on('connect', () => {
      console.log('Socket.io connected successfully');
    });
    
    s.on('connect_error', (error) => {
      console.warn('Socket.io connection error:', error.message);
      // Don't throw error - allow app to continue functioning without real-time updates
    });
    
    s.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
    });
    
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

              {/* Dashboard redirect for technicians - redirect to /tech */}
              <Route element={<ProtectedRoute allowedRoles={['Technician', 'TECHNICIAN']} />}>
                <Route path="/dashboard" element={<Navigate to="/tech" replace />} />
              </Route>

              {/* System Admin Routes */}
              {/* System Admin Routes (God Mode) */}
              <Route element={<ProtectedRoute allowedRoles={['System Admin']} />}>
                <Route element={<SystemAdminLayout />}>
                  <Route path="/sys-admin" element={<GlobalDashboard />} />
                  <Route path="/sys-admin/accounts" element={<AccountManagement />} />
                  <Route path="/sys-admin/companies" element={<CompanyRegistry />} />
                  <Route path="/sys-admin/users" element={<MasterUserTable />} />
                  <Route path="/sys-admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/sys-admin/settings" element={<GlobalSettings />} />
                  <Route path="/sys-admin/broadcast" element={<BroadcastCenter />} />
                  <Route path="/sys-admin/analytics" element={<CrossTenantAnalytics />} />
                  <Route path="/sys-admin/ticket-search" element={<GlobalTicketSearch />} />
                  <Route path="/sys-admin/data-cleanup" element={<BulkDataCleanup />} />
                </Route>
              </Route>

              {/* Super Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
                <Route element={<SuperAdminLayout />}>
                  <Route path="/admin" element={<SuperAdminDashboard />} />
                  <Route path="/admin/dashboard" element={<BossDashboard />} />
                  <Route path="/admin/assign" element={<ManualAssignment />} />
                  <Route path="/admin/companies" element={<CompanyDirectory />} />
                </Route>
              </Route>

              {/* Technician Routes - SINGLE PAGE ONLY */}
              <Route element={<ProtectedRoute allowedRoles={['Technician', 'TECHNICIAN']} />}>
                <Route path="/tech" element={<TechDashboard />} />
                <Route path="/tech/*" element={<TechDashboard />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Worker', 'Employee']} />}>
                <Route path="/portal" element={<UserDashboard />} />
                <Route path="/portal/new-ticket" element={<TicketWizard />} />
                <Route path="/portal/tickets/:id" element={<UserTicketView />} />
              </Route>

              {/* Legacy/General Protected Routes - Exclude Technicians */}
              <Route element={<ProtectedRoute allowedRoles={['Super Admin', 'System Admin', 'Team Lead', 'Worker', 'Employee']} />}>
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
