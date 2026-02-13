const API_BASE_URL = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const isDataUrl = (value) => typeof value === 'string' && value.startsWith('data:');

export const resolveMediaUrl = (value) => {
    if (!value) return '';
    const source = String(value).trim();
    if (!source) return '';
    if (source.startsWith('http://') || source.startsWith('https://') || source.startsWith('blob:') || source.startsWith('data:')) {
        return source;
    }
    return `${API_BASE_URL.replace(/\/$/, '')}/${source.replace(/^\/+/, '')}`;
};

