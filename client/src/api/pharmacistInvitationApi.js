import axiosInstance from './axiosInstance';

export const generatePharmacistInvitation = () => 
  axiosInstance.post('/pharmacist-invitations/generate').then((r) => r.data);
