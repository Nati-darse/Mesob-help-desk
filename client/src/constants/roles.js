export const ROLES = {
    SYSTEM_ADMIN: 'System Admin',
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    TECHNICIAN: 'Technician',
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
    [ROLES.SYSTEM_ADMIN]: '/sys-admin',
    [ROLES.SUPER_ADMIN]: '/admin',
    [ROLES.ADMIN]: '/admin',
    [ROLES.TECHNICIAN]: '/tech',
    [ROLES.TEAM_LEAD]: '/team-lead',
    [ROLES.WORKER]: '/portal',
    [ROLES.EMPLOYEE]: '/portal',
};
