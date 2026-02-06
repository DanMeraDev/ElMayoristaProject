import axios from './axios';

export const registerSeller = (user) => axios.post('/auth/register', user);

export const login = (user) => axios.post('/auth/login', user);

// Get current user profile (requires authentication)
export const getCurrentUser = () => axios.get('/users/me');

// Password Recovery
export const forgotPassword = (email) => axios.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) => axios.post('/auth/reset-password', { token, newPassword });