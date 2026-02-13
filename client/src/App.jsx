import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline, Snackbar, Alert, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
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

const playUrgentBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 200);
  } catch {
    // ignore
  }
};

const AppContent = () => {
  const { mode } = useColorMode();
  const { user, updateUser } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const isSystemAdmin = user?.role === ROLES.SYSTEM_ADMIN;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const theme = getTheme(mode, isSystemAdmin, isSuperAdmin);
  const qc = useQueryClient();
  const socketRef = useRef(null);
  const [broadcastQueue, setBroadcastQueue] = useState([]);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const getBroadcastStorageKey = () => {
    const userId = user?._id || 'anon';
    const role = user?.role || 'unknown';
    const company = user?.companyId || '0';
    return `mesob_broadcast_history_${userId}_${role}_${company}`;
  };

  const isBroadcastRelevant = (notification) => {
    if (!notification || !user) return false;
    const targetType = notification.targetType;
    const targetValue = notification.targetValue;
    const targetCompanyId = notification.targetCompanyId;

    if (targetType === 'all') return true;

    if (targetType === 'company') {
      const companyTarget = targetValue ?? targetCompanyId;
      return companyTarget != null && String(user.companyId) === String(companyTarget);
    }

    if (targetType === 'role' && targetValue) {
      if (String(user.role) !== String(targetValue)) return false;
      if (targetCompanyId == null) return true;
      return String(user.companyId) === String(targetCompanyId);
    }

    if (targetType === 'specific' && targetValue) {
      return String(user._id) === String(targetValue);
    }

    return false;
  };

  // Check if user needs to change password on first login
  useEffect(() => {
    if (user && user.isFirstLogin === true) {
      setShowPasswordDialog(true);
    }
  }, [user]);

  const unreadCount = broadcastHistory.filter((item) => !item?.read).length;

  const handleOpenNotifications = () => {
    setNotificationCenterOpen(true);
  };

  useEffect(() => {
    if (!activeBroadcast && broadcastQueue.length > 0) {
      const next = broadcastQueue[0];
      setActiveBroadcast(next);
      setBroadcastQueue((prev) => prev.slice(1));
      setBroadcastHistory((prev) => {
        const nextItem = { ...next, read: false };
        const updated = [nextItem, ...prev];
        try {
          localStorage.setItem(getBroadcastStorageKey(), JSON.stringify(updated.slice(0, 50)));
        } catch (err) {
          // ignore storage failures
        }
        return updated;
      });

      if (next?.priority === 'error') {
        try {
          playUrgentBeep();
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [broadcastQueue, activeBroadcast]);

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
      setBroadcastQueue([]);
      setActiveBroadcast(null);
      setBroadcastHistory([]);
      setNotificationCenterOpen(false);
      return;
    }

    try {
      const stored = localStorage.getItem(getBroadcastStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(isBroadcastRelevant).map((item) => ({
            ...item,
            read: Boolean(item.read)
          }));
          setBroadcastHistory(filtered);
        } else {
          setBroadcastHistory([]);
        }
      } else {
        setBroadcastHistory([]);
      }
    } catch {
      // ignore
    }
    const socketBaseUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let authToken = user?.token;
    if (!authToken) {
      try {
        const stored = JSON.parse(sessionStorage.getItem('mesob_user') || '{}');
        authToken = stored?.token;
      } catch {
        authToken = null;
      }
    }
    if (!authToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const s = io(socketBaseUrl, {
      transports: ['websocket'],
      auth: {
        token: authToken,
        companyId: user.companyId
      },
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
      if (!isBroadcastRelevant(notification)) return;
      qc.setQueryData(['notifications'], (prev) => {
        const list = Array.isArray(prev) ? prev : [];
        // data might come from API with _id, ensure structure
        return [notification, ...list];
      });
      setBroadcastQueue((prev) => [...prev, notification]);
    });
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user, qc]);

  useEffect(() => {
    if (!notificationCenterOpen) return;
    setBroadcastHistory((prev) => {
      const updated = prev.map((item) => ({ ...item, read: true }));
      try {
        localStorage.setItem(getBroadcastStorageKey(), JSON.stringify(updated.slice(0, 50)));
      } catch (err) {
        // ignore
      }
      return updated;
    });
  }, [notificationCenterOpen]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar unreadCount={unreadCount} onOpenNotifications={handleOpenNotifications} />
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

              {/* Team Leader Routes */}
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
        {/* Global Broadcast Toasts */}
        <Snackbar
          open={Boolean(activeBroadcast)}
          autoHideDuration={5000}
          onClose={() => setActiveBroadcast(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {activeBroadcast ? (
            <Alert
              severity={activeBroadcast.priority || 'info'}
              variant="filled"
              onClose={() => setActiveBroadcast(null)}
              onClick={handleOpenNotifications}
              sx={{ cursor: 'pointer' }}
            >
              {activeBroadcast.message || 'New broadcast message'}
            </Alert>
          ) : null}
        </Snackbar>

        {/* Notification Center */}
        <Dialog
          open={notificationCenterOpen}
          onClose={() => setNotificationCenterOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Broadcast Notifications
            <IconButton onClick={() => setNotificationCenterOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
              X
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {broadcastHistory.length === 0 ? (
              <Typography color="text.secondary">No broadcasts yet.</Typography>
            ) : (
              <List>
                {broadcastHistory.map((item) => (
                  <ListItem key={item._id || item.id}>
                    <ListItemText
                      primary={item.message || 'Broadcast'}
                      secondary={item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
        </Dialog>

        {/* First Login Password Change Dialog */}
        {user && (
          <ChangePasswordDialog
            open={showPasswordDialog}
            onClose={() => { }} // Prevent closing
            onSuccess={handlePasswordChangeSuccess}
          />
        )}
    </ThemeProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  );
}

export default App;

