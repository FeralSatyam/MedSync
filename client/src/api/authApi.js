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

export const sendVerifyOtp = (email) =>
  axiosInstance.post('/auth/send-verify-otp', { email }).then((r) => r.data);

export const verifyEmail = (email, otp) =>
  axiosInstance.post('/auth/verify-email', { email, otp }).then((r) => r.data);

// Change Password - API call only (backend logic is in server)
export const changePassword = (payload) =>
  axiosInstance.put('/auth/change-password', payload).then((r) => r.data);

// ─── Account-wide dispensing PIN ───
export const getDispensingPinStatus = () =>
  axiosInstance.get('/auth/dispensing-pin').then((r) => r.data);

export const setDispensingPin = (pin) =>
  axiosInstance.post('/auth/dispensing-pin', { pin }).then((r) => r.data);

export const changeDispensingPin = (currentPin, newPin) =>
  axiosInstance.put('/auth/dispensing-pin', { currentPin, newPin }).then((r) => r.data);

export const resetDispensingPin = (payload) =>
  axiosInstance.post('/auth/dispensing-pin/reset', payload).then((r) => r.data);