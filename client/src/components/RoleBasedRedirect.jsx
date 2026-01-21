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
    const userRole = user.role;
    console.log('RoleBasedRedirect - User role:', userRole); // Debug log
    console.log('RoleBasedRedirect - Full user object:', user); // Debug log

    switch (userRole) {
      case 'System Admin':
        console.log('Redirecting to /sys-admin');
        navigate('/sys-admin');
        break;
      case 'Super Admin':
        console.log('Redirecting to /admin');
        navigate('/admin');
        break;
      case 'Technician':
      case 'TECHNICIAN':
        console.log('Redirecting to /tech');
        navigate('/tech');
        break;
      case 'Team Lead':
        console.log('Redirecting to /dashboard');
        navigate('/dashboard');
        break;
      case 'Worker':
      case 'Employee':
        console.log('Redirecting to /portal');
        navigate('/portal');
        break;
      default:
        console.log('No role match, redirecting to /');
        navigate('/');
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
