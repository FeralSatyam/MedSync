import axios from 'axios';

// Get the base URL from environment variable
const getBaseURL = () => {
  // Production (Vercel) - use Render backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://medsync-api.onrender.com/api';
  }
  // Development (localhost)
  return 'http://localhost:5000/api';
};

const api = axios.create({ 
  baseURL: getBaseURL(),
  withCredentials: false,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('medsync-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch (e) {
      console.error('Error parsing auth storage:', e);
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medsync-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;