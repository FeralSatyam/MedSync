import axiosInstance, { setStoredToken } from './axiosInstance';

export async function register(payload) {
  const { data } = await axiosInstance.post('/auth/register', payload);
  if (data.token) setStoredToken(data.token);
  return data;
}

export async function login(payload) {
  const { data } = await axiosInstance.post('/auth/login', payload);
  if (data.token) setStoredToken(data.token);
  return data;
}

export async function logout() {
  try {
    await axiosInstance.post('/auth/logout');
  } finally {
    setStoredToken(null);
  }
}

export async function getMe() {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
}
