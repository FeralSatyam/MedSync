import axiosInstance from './axiosInstance';

export const getPatients = () => axiosInstance.get('/patients').then((r) => r.data);

export const createPatient = (payload) =>
  axiosInstance.post('/patients', payload).then((r) => r.data);

export const getPatient = (id) => axiosInstance.get(`/patients/${id}`).then((r) => r.data);

export const updatePatient = (id, payload) =>
  axiosInstance.put(`/patients/${id}`, payload).then((r) => r.data);

export const deletePatient = (id) => axiosInstance.delete(`/patients/${id}`).then((r) => r.data);

export const getQrData = (id) => axiosInstance.get(`/patients/${id}/qr`).then((r) => r.data);
