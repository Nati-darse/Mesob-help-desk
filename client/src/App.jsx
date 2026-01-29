import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';
import { ColorModeProvider, useColorMode } from './context/ColorModeContext';
import { getTheme } from './styles/theme';
import Navbar from './components/Navbar';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Landing from './pages/Landing';
import ChangePasswordDialog from './components/ChangePasswordDialog';

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
// Adding back all new system admin pages
import AccountManagement from './features/system-admin/pages/AccountManagement';
import BulkDataCleanup from './features/system-admin/pages/BulkDataCleanup';
import CrossTenantAnalytics from './features/system-admin/pages/CrossTenantAnalytics';
import GlobalDashboard from './features/system-admin/pages/GlobalDashboard';
import GlobalTicketSearch from './features/system-admin/pages/GlobalTicketSearch';
import MasterUserTable from './features/system-admin/pages/MasterUserTable';
import SystemMonitor from './features/system-admin/pages/SystemMonitor';
import TechDashboard from './features/technician/pages/TechDashboard';
import TechWorkspace from './features/technician/pages/TechWorkspace';
import TicketAction from './features/technician/pages/ResolutionPage';
import UserDashboard from './features/employee/pages/UserDashboard';
import TicketWizard from './features/employee/pages/TicketWizard';
import UserTicketView from './features/employee/pages/UserTicketView';
import SuperAdminLayout from './features/admin/layouts/SuperAdminLayout';
import GlobalUserEditor from './features/system-admin/pages/GlobalUserEditor';
import Profile from './pages/Profile';
import TeamLeadDashboard from './features/employee/pages/TeamLeadDashboard';
import TicketReviews from './features/admin/pages/TicketReviews';
import AdminCommandCenter from './features/admin/pages/AdminCommandCenter';
import LoginDebug from './pages/LoginDebug';
import AdminReports from './features/admin/pages/AdminReports';

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
  const { user, updateUser } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const isSystemAdmin = user?.role === ROLES.SYSTEM_ADMIN;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const theme = getTheme(mode, isSystemAdmin, isSuperAdmin);
  const qc = useQueryClient();
  const socketRef = useRef(null);

  // Check if user needs to change password on first login
  useEffect(() => {
    if (user && user.isFirstLogin === true) {
      setShowPasswordDialog(true);
    }
  }, [user]);

  const handlePasswordChangeSuccess = () => {
    setShowPasswordDialog(false);
    // Update user context to reflect password change
    updateUser({ isFirstLogin: false });
  };

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    const s = io(import.meta.env.VITE_SERVER_URL || 'https://mesob-help-desk.onrender.com', {
      transports: ['websocket'],
      auth: { companyId: user.companyId },
      extraHeaders: { 'x-tenant-id': String(user.companyId || '') }
    });
    socketRef.current = s;
    s.emit('join_company', user.companyId);
    s.on('ticket_updated', (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
    });
    s.on('ticket_created', (ticket) => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
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
              <Route path="/login-debug" element={<LoginDebug />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/redirect" element={<RoleBasedRedirect />} />
              <Route path="/maintenance" element={<MaintenancePage />} />

              {/* System Admin Routes */}
              {/* System Admin Routes (God Mode) */}
              {/* All system admin routes restored */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]} />}>
                <Route element={<SystemAdminLayout />}>
                  <Route path="/sys-admin" element={<SysDashboard />} />
                  <Route path="/sys-admin/dashboard" element={<GlobalDashboard />} />
                  <Route path="/sys-admin/companies" element={<CompanyRegistry />} />
                  <Route path="/sys-admin/users" element={<GlobalUserEditor />} />
                  <Route path="/sys-admin/master-users" element={<MasterUserTable />} />
                  <Route path="/sys-admin/accounts" element={<AccountManagement />} />
                  <Route path="/sys-admin/tickets" element={<GlobalTicketSearch />} />
                  <Route path="/sys-admin/analytics" element={<CrossTenantAnalytics />} />
                  <Route path="/sys-admin/monitor" element={<SystemMonitor />} />
                  <Route path="/sys-admin/cleanup" element={<BulkDataCleanup />} />
                  <Route path="/sys-admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/sys-admin/settings" element={<GlobalSettings />} />
                  <Route path="/sys-admin/broadcast" element={<BroadcastCenter />} />
                  <Route path="/sys-admin/reviews" element={<TicketReviews />} />
                  <Route path="/sys-admin/reports" element={<AdminReports />} />
                </Route>
              </Route>

              {/* Super Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                <Route element={<SuperAdminLayout />}>
                  <Route path="/admin" element={<AdminCommandCenter />} />
                  <Route path="/admin/dashboard" element={<BossDashboard />} />
                  <Route path="/admin/assign" element={<ManualAssignment />} />
                  <Route path="/admin/companies" element={<CompanyDirectory />} />
                  <Route path="/admin/users" element={<GlobalUserEditor />} />
                  <Route path="/admin/broadcast" element={<BroadcastCenter />} />
                  <Route path="/admin/settings" element={<GlobalSettings />} />
                  <Route path="/admin/reviews" element={<TicketReviews />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                </Route>
              </Route>

              {/* Team Lead Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.TEAM_LEAD]} />}>
                <Route path="/team-lead" element={<TeamLeadDashboard />} />
              </Route>

              {/* Technician Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]} />}>
                <Route path="/tech" element={<TechDashboard />} />
                <Route path="/tech/mission-control" element={<TechWorkspace />} />
                <Route path="/tech/tickets/:id" element={<TicketAction />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]} />}>
                <Route path="/portal" element={<UserDashboard />} />
                <Route path="/portal/new-ticket" element={<TicketWizard />} />
                <Route path="/portal/tickets/:id" element={<UserTicketView />} />
              </Route>

              {/* Catch-all Dashboard Redirect */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />

              {/* Legacy/General Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/tickets" element={<TicketList />} />
                <Route path="/tickets/new" element={<CreateTicket />} />
                <Route path="/tickets/:id" element={<TicketDetails />} />
              </Route>
            </Routes>
          </Box>
        </Box>
        {/* First Login Password Change Dialog */}
        {user && (
          <ChangePasswordDialog
            open={showPasswordDialog}
            onClose={() => {}} // Prevent closing
            onSuccess={handlePasswordChangeSuccess}
          />
        )}
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
