export const ROLES = {
    SYSTEM_ADMIN: 'System Admin',
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TECHNICIAN: 'TECHNICIAN',
    TEAM_LEAD: 'Team Lead',
    WORKER: 'Worker',
    EMPLOYEE: 'Worker', // Alias for Worker
};

export const ROLE_LABELS = {
    'System Admin': 'System Administrator',
    'Super Admin': 'Super Administrator',
    'Admin': 'Administrator',
    'Technician': 'IT Technician',
    'Team Lead': 'Team Leader',
    'Worker': 'Employee',
};

export const ROLE_ROUTES = {
    'System Admin': '/sys-admin',
    'Super Admin': '/admin/dashboard',
    'Admin': '/admin/dashboard',
    'TECHNICIAN': '/tech',
    'Technician': '/tech', // Fallback for proper case
    'Team Lead': '/team-lead',
    'Worker': '/portal',
    'Employee': '/portal', // Alias for Worker
};
