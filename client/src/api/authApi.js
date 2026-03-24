import axiosInstance from './axiosInstance';

export async function register(payload) {
  const { data } = await axiosInstance.post('/auth/register', payload);
  return data;
}

export async function login(payload) {
  const { data } = await axiosInstance.post('/auth/login', payload);
  return data;
}

export async function logout() {
  return axiosInstance.post('/auth/logout').then((r) => r.data);
}

export async function getMe() {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
}

export async function updateMe(payload) {
  const { data } = await axiosInstance.put('/auth/me', payload);
  return data;
}

export async function deleteMe() {
  const { data } = await axiosInstance.delete('/auth/me');
  return data;
}

export async function requestPasswordOtp(payload) {
  const { data } = await axiosInstance.post('/auth/forgot-password/request-otp', payload);
  return data;
}

export async function resetPasswordWithOtp(payload) {
  const { data } = await axiosInstance.post('/auth/forgot-password/reset', payload);
  return data;
}
