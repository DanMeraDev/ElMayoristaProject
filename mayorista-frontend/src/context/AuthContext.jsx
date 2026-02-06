import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { login as loginRequest, getCurrentUser } from '../api/auth.api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const [errors, setErrors] = useState([]);

  // Cargar sesión desde localStorage al iniciar y verificar token
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // First, set user from localStorage for quick UI
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Then verify token with backend
          const res = await getCurrentUser();
          const freshUserData = res.data;

          // Update with fresh data from backend
          localStorage.setItem('user', JSON.stringify(freshUserData));
          setUser(freshUserData);

          console.log('Token verified, user:', freshUserData.fullName);
        } catch (error) {
          console.error('Token verification failed:', error);

          // If 401, token is expired - clear and redirect
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);

            // Check if not already on auth pages
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath === '/login' || currentPath === '/register' ||
              currentPath === '/forgot-password' || currentPath === '/reset-password' ||
              currentPath === '/pending-approval';

            if (!isAuthPage) {
              sessionStorage.setItem('sessionExpired', 'true');
              window.location.href = '/login';
              return; // Stop execution
            }
          } else {
            // Other errors - keep user logged in with cached data
            console.log('Using cached user data due to network error');
          }
        }
      }
      setIsLoading(false); // Done loading
    };

    verifyAuth();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'token' && !event.newValue) {
        // Token was removed from another tab, log out this tab too
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signup = async (user) => {
    try {
      // Solo registra, no loguea
      const res = await import('../api/auth.api').then(module => module.registerSeller(user));
      return res.data;
    } catch (error) {
      console.error(error);
      if (Array.isArray(error.response.data)) {
        return setErrors(error.response.data);
      }
      setErrors([error.response.data.message]);
      throw error;
    }
  };

  const signin = async (user) => {
    try {
      const res = await loginRequest(user);

      const { token, ...userData } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      return res.data; // Retornamos para poder manejar redirección en el componente
    } catch (error) {
      console.error(error);
      if (Array.isArray(error.response.data)) {
        setErrors(error.response.data);
      } else if (error.response?.data?.message) {
        setErrors([error.response.data.message]);
      } else if (typeof error.response.data === 'object') {
        setErrors(Object.values(error.response.data));
      } else {
        setErrors(["Login failed"]);
      }
      throw error; // Lanzamos error para que el componente sepa que falló
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  // Refresh user data from backend
  const refreshUser = async () => {
    try {
      const res = await getCurrentUser();
      const userData = res.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If 401, user session is invalid - logout
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signup,
        signin,
        logout,
        refreshUser,
        user,
        isAuthenticated,
        isLoading,
        errors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};