import axiosInstance from './axiosInstance';

export const getMedicinesForPatient = (patientId) =>
  axiosInstance.get(`/medicines/patient/${patientId}`).then((r) => r.data);

export const createMedicine = (formData) =>
  axiosInstance.post('/medicines', formData).then((r) => r.data);

export const updateMedicine = (id, body) => {
  return axiosInstance
    .put(`/medicines/${id}`, body)
    .then((r) => r.data);
};

export const restockMedicine = (id, quantityAdded) =>
  axiosInstance
    .patch(`/medicines/${id}/restock`, { quantity: quantityAdded })
    .then((r) => r.data);

export const deleteMedicine = (id) =>
  axiosInstance.delete(`/medicines/${id}`).then((r) => r.data);
