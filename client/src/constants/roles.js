export const ROLES = {
    SYSTEM_ADMIN: 'System Admin',
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TECHNICIAN: 'Technician', // Fixed: Changed from 'TECHNICIAN' to 'Technician'
    TEAM_LEAD: 'Team Lead',
    WORKER: 'Worker',
    EMPLOYEE: 'Worker', // Alias for Worker
};

export const ROLE_LABELS = {
    'System Admin': 'System Administrator',
    'Super Admin': 'Super Administrator',
    'Admin': 'Administrator',
    'Technician': 'IT Technician', // Fixed: Changed from 'TECHNICIAN' to 'Technician'
    'Team Lead': 'Team Leader',
    'Worker': 'Employee',
};

export const ROLE_ROUTES = {
    'System Admin': '/sys-admin',
    'Super Admin': '/admin/dashboard',
    'Admin': '/admin/dashboard',
    'Technician': '/tech', // Fixed: Changed from 'TECHNICIAN' to 'Technician'
    'Team Lead': '/team-lead',
    'Worker': '/portal',
    'Employee': '/portal', // Alias for Worker
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
    'System Admin': 5,
    'Super Admin': 4,
    'Admin': 3,
    'Team Lead': 2,
    'Technician': 1,
    'Worker': 0
};

// Helper function to check if user has required permission level
export const hasPermission = (userRole, requiredRole) => {
    return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};
