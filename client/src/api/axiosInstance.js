import axios from 'axios';

const getBaseURL = () => {
  // Production (Vercel) - use your Render backend URL
  if (import.meta.env.PROD) {
    return 'https://medsync-tle2.onrender.com/api';  // Your Render backend URL
  }
  // Development (localhost)
  return 'http://localhost:5000/api';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: false,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('medsync-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const token = parsed?.state?.token || parsed?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Error parsing auth storage:', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Pharmacist QR/OTP endpoints are public — wrong OTP returns 401 but
      // should never redirect to login; let the caller handle the error instead.
      const url = error.config?.url || '';
      const isPharmacistEndpoint = url.includes('/pharmacist/');
      if (!isPharmacistEndpoint) {
        localStorage.removeItem('medsync-auth');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;