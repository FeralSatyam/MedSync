import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.PROD) {
    return 'https://medsync-tle2.onrender.com/api';
  }
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
        // Silent fail - remove console.error
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('medsync-auth');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;