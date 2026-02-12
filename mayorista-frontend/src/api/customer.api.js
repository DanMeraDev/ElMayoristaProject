import axios from './axios';

// ===== Seller endpoints =====

export const registerCustomer = async (data) => {
    const response = await axios.post('/customers', data);
    return response.data;
};

export const getApprovedCustomers = async () => {
    const response = await axios.get('/customers/approved');
    return response.data;
};

export const createCustomerFiado = async (data) => {
    const response = await axios.post('/customer-fiados', data);
    return response.data;
};

export const getMyCustomerFiados = async () => {
    const response = await axios.get('/customer-fiados/my-fiados');
    return response.data;
};

// ===== Admin endpoints =====

export const getAllCustomers = () => axios.get('/customers/admin/all');

export const getPendingCustomers = () => axios.get('/customers/admin/pending');

export const approveCustomer = (id) => axios.post(`/customers/admin/${id}/approve`);

export const rejectCustomer = (id, reason) => axios.post(`/customers/admin/${id}/reject`, { reason });
