import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // Use relative path for proxy
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors globally
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (expired JWT) or 403 Forbidden (account disabled)
    if (error.response?.status === 401 || error.response?.status === 403) {
      const isForbidden = error.response?.status === 403;

      // Clear stale authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Check if we're not already on the login page to avoid redirect loops
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register' ||
        currentPath === '/forgot-password' || currentPath === '/reset-password';

      if (!isAuthPage) {
        // Store message to show on login page
        if (isForbidden) {
          sessionStorage.setItem('loginError', 'Tu cuenta ha sido deshabilitada. Contacta al administrador.');
        } else {
          sessionStorage.setItem('sessionExpired', 'true');
        }

        // Redirect to login page
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
