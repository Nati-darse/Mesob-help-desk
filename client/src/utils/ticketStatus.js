export const STATUS_COLORS = {
    New: 'primary',
    Assigned: 'secondary',
    'In Progress': 'info',
    Resolved: 'success',
    Closed: 'default'
};

export const REVIEW_STATUS_COLORS = {
    None: 'default',
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'error'
};

export const getStatusColor = (status) => STATUS_COLORS[status] || 'default';
export const getReviewStatusColor = (status) => REVIEW_STATUS_COLORS[status] || 'default';
