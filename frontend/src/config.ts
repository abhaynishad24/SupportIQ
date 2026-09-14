// Local: http://localhost:5000
// Production: Vercel environment variable VITE_API_URL
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const apiUrl = (path: string) => `${API_BASE}${path}`;
