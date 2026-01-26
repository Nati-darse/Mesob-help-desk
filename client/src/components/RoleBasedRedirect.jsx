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
    console.log('Redirecting user with role:', user.role);

    // Convert role to standard comparison (trim and same case)
    const normalizedRole = String(user.role).trim();

    switch (normalizedRole) {
      case ROLES.SYSTEM_ADMIN:
        console.log('Match: SYSTEM_ADMIN');
        navigate('/sys-admin');
        break;
      case ROLES.SUPER_ADMIN:
        console.log('Match: SUPER_ADMIN');
        navigate('/admin');
        break;
      case ROLES.TECHNICIAN:
        navigate('/tech');
        break;
      case ROLES.TEAM_LEAD:
        navigate('/teamleaderdashboard');
        break;
      case ROLES.EMPLOYEE:
      case ROLES.WORKER:
        navigate('/portal');
        break;
      default:
        console.log('No specific match, going to generic dashboard');
        navigate('/dashboard');
    }
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
