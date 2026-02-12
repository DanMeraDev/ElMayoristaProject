import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // Use relative path for proxy
  timeout: 30000,
  withCredentials: true, // Enviar cookies HttpOnly automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle 401 errors globally
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (expired JWT) or 403 Forbidden (account disabled)
    // Skip redirect for auth verification calls (handled by AuthContext)
    const requestUrl = error.config?.url || '';
    if (requestUrl.includes('/users/me') || requestUrl.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      const isForbidden = error.response?.status === 403;

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
