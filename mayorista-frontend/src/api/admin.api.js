import axios from './axios';

// Close Cycle and Download Report
export const closeCycle = async () => {
  try {
    const response = await axios.post('/reports/close-cycle', null, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get all pending sellers
export const getPendingSellers = () => axios.get('/admin/sellers/pending');

// Get all sellers (with optional pagination)
export const getAllSellers = () => axios.get('/admin/sellers');

// Approve a seller
export const approveSeller = (sellerId) => axios.post(`/admin/sellers/${sellerId}/approve`);

// Reject a seller with reason
export const rejectSeller = (sellerId, reason) => axios.post(`/admin/sellers/${sellerId}/reject`, { reason });

// Update seller commission
export const updateSellerCommission = (sellerId, commissionPercentage) =>
  axios.put(`/admin/sellers/${sellerId}/commission?commissionPercentage=${commissionPercentage}`);

// Get all users (filter by role in frontend)
export const getAllUsers = (page = 0, size = 1000) =>
  axios.get(`/users?page=${page}&size=${size}`);

// Get user by ID
export const getUserById = (userId) => axios.get(`/users/${userId}`);

// Get user's monthly commission
export const getUserCommission = (userId) => axios.get(`/users/${userId}/commission`);

// Get user's sales
export const getUserSales = (userId, page = 0, size = 10) =>
  axios.get(`/users/${userId}/sales?page=${page}&size=${size}`);

// Update seller permissions
export const updateSellerPermissions = (userId, permissions) =>
  axios.put(`/users/${userId}/permissions`, permissions);

// ========== Sales Management ==========

// Get sale by ID
export const getSaleById = (saleId) => axios.get(`/sales/${saleId}`);

// Get all sales for admin history
export const getAllSales = (page = 0, size = 10) =>
  axios.get(`/admin/sales?page=${page}&size=${size}&sort=orderDate,desc`);

// ========== Sales Review (Admin) ==========

// Get all sales under review
export const getSalesUnderReview = (page = 0, size = 10) =>
  axios.get(`/admin/sales/under-review?page=${page}&size=${size}`);

// Review a sale (approve or reject)
export const reviewSale = (saleId, approved, rejectionReason = null) =>
  axios.post(`/admin/sales/${saleId}/review`, { approved, rejectionReason });

// Toggle seller enabled status
export const toggleSellerEnabled = (sellerId, enabled) =>
  axios.put(`/admin/sellers/${sellerId}/enabled?enabled=${enabled}`);

// ========== Cycle Management ==========

// Get all closed cycles (history)
export const getCycles = () => axios.get('/reports/cycles');

// Get current cycle statistics (pending to close)
export const getCurrentCycleStats = () => axios.get('/reports/current-cycle');

// Get a specific cycle by ID
export const getCycleById = (cycleId) => axios.get(`/reports/cycles/${cycleId}`);

// ========== Fiados Management (Admin) ==========

// Get all fiados from all sellers
export const getAllFiados = () => axios.get('/fiados/admin/all');

// Delete a fiado (admin)
export const adminDeleteFiado = (fiadoId) => axios.delete(`/fiados/admin/${fiadoId}`);

// Get all customer fiados
export const getAllCustomerFiados = () => axios.get('/customer-fiados/admin/all');

// Delete a customer fiado (admin)
export const adminDeleteCustomerFiado = (fiadoId) => axios.delete(`/customer-fiados/admin/${fiadoId}`);
