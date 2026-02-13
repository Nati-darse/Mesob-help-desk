import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { ROLES } from '../constants/roles';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect based on user role
    const normalizedRole = String(user.role).trim();

    let redirectPath = '/login';

    // Direct string comparison for reliability
    if (normalizedRole === 'System Admin') {
      redirectPath = '/sys-admin';
    } else if (normalizedRole === 'Super Admin') {
      redirectPath = '/admin';
    } else if (normalizedRole === 'Technician') {
      redirectPath = '/tech';
    } else if (normalizedRole === 'Team Lead') {
      redirectPath = '/team-lead';
    } else if (normalizedRole === 'Employee' || normalizedRole === 'Worker') {
      redirectPath = '/portal';
    } else {
      console.warn('⚠️ Unknown role:', normalizedRole);
    }

    navigate(redirectPath, { replace: true });
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px'
    }}>
      Redirecting to your dashboard...
    </div>
  );
};

export default RoleBasedRedirect;
