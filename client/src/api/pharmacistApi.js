import axiosInstance from './axiosInstance';

/** Public endpoints — no auth required; uses same API base as the rest of the app */
export function getPharmacistData(qrToken) {
  return axiosInstance.get(`/pharmacist/${qrToken}`).then((r) => r.data);
}

export function dispense(qrToken, body) {
  return axiosInstance.post(`/pharmacist/${qrToken}/dispense`, body).then((r) => r.data);
}
