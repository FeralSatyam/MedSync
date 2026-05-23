import axiosInstance from './axiosInstance';

export const getPatients = () => axiosInstance.get('/patients').then((r) => r.data);

export const createPatient = (payload) =>
  axiosInstance.post('/patients', payload).then((r) => r.data);

export const getPatient = (id) => axiosInstance.get(`/patients/${id}`).then((r) => r.data);

export const getPatientByQrToken = (qrToken) => {
  // console.log('Calling API with token:', qrToken);
  return axiosInstance.get(`/patients/qr/${qrToken}`).then((r) => {
    // console.log('API Response:', r.data);
    return r.data;
  });
};

export const updatePatient = (id, payload) =>
  axiosInstance.put(`/patients/${id}`, payload).then((r) => r.data);

export const deletePatient = (id) => axiosInstance.delete(`/patients/${id}`).then((r) => r.data);

export const getQrData = (id) => axiosInstance.get(`/patients/${id}/qr`).then((r) => r.data);

export const generatePatientOtp = (id) =>
  axiosInstance.post(`/patients/${id}/generate-otp`).then((r) => r.data);
