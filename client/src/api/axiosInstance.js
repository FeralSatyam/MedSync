import axios from 'axios';

// Get the base URL - works for both local and Vercel
const getBaseURL = () => {
  // In production (Vercel), use relative path
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In development, use the env variable or localhost
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
};

const api = axios.create({ 
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000
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