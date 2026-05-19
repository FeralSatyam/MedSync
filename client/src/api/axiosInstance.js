import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.PROD) {
    return 'https://medsync-tle2.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({ 
  baseURL: getBaseURL(),
  withCredentials: false, // Change to false for Render
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
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
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