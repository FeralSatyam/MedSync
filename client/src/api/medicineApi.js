import axiosInstance from './axiosInstance';

export const getMedicinesForPatient = (patientId) =>
  axiosInstance.get(`/medicines/patient/${patientId}`).then((r) => r.data);

export const createMedicine = (formData) =>
  axiosInstance.post('/medicines', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateMedicine = (id, body) => {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  return axiosInstance
    .put(`/medicines/${id}`, body, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})
    .then((r) => r.data);
};

export const restockMedicine = (id, quantityAdded) =>
  axiosInstance.put(`/medicines/${id}/restock`, { quantityAdded }).then((r) => r.data);

export const deleteMedicine = (id) =>
  axiosInstance.delete(`/medicines/${id}`).then((r) => r.data);
