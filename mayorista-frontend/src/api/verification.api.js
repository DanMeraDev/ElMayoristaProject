import api from './axios';

export const verifyCedula = (cedula) => api.get(`/verification/cedula/${cedula}`);
export const verifyRuc = (ruc) => api.get(`/verification/ruc/${ruc}`);
export const verifyWhatsapp = (phone) => api.get(`/verification/whatsapp/${phone}`);
