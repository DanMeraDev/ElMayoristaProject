import axios from './axios';

// Upload a PDF report
export const uploadReport = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post('/reports/upload-report', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Get current user's sales
export const getMySales = (userId, page = 0, size = 10) =>
    axios.get(`/users/${userId}/sales?page=${page}&size=${size}`);

// Get current user's commission
export const getMyCommission = (userId) =>
    axios.get(`/users/${userId}/commission`);

// Get current user's detailed commission stats
export const getCommissionStats = (userId) =>
    axios.get(`/users/${userId}/commission-stats`);

// Get user profile by ID (includes commissionPercentage)
export const getMyProfile = (userId) =>
    axios.get(`/users/${userId}`);

// Get sale details by ID (includes paymentStatus, totalPaid, remainingAmount, payments array)
export const getSaleDetails = (saleId) =>
    axios.get(`/sales/${saleId}`);

// Register a payment with receipt (partial or complete)
// Uses multipart/form-data to send both payment data and receipt file
export const registerPaymentWithReceipt = (saleId, amount, paymentMethod, notes, file) => {
    const formData = new FormData();
    formData.append('saleId', saleId);
    formData.append('amount', amount);
    formData.append('paymentMethod', paymentMethod);
    formData.append('notes', notes || '');
    if (file) {
        formData.append('file', file);
    }

    return axios.post('/payments', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Create a TV sale (manual form)
export const createTvSale = (data) =>
    axios.post('/sales/tv', data);

// Delete a sale (only if seller owns it and status allows)
export const deleteSale = (saleId) =>
    axios.delete(`/sales/${saleId}`);

// Delete a payment/receipt (only if seller owns the sale and status allows)
export const deletePayment = (saleId, paymentId) =>
    axios.delete(`/payments/${saleId}/payments/${paymentId}`);

