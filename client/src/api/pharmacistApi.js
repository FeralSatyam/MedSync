import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

/** Public endpoints — no auth cookie required */
export function getPharmacistData(qrToken) {
  return axios.get(`${baseURL}/pharmacist/${qrToken}`).then((r) => r.data);
}

export function dispense(qrToken, body) {
  return axios.post(`${baseURL}/pharmacist/${qrToken}/dispense`, body).then((r) => r.data);
}
