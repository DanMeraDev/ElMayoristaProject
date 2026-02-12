import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginRequest, getCurrentUser, logout as logoutRequest } from '../api/auth.api';

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
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Intentar obtener el usuario actual usando la cookie HttpOnly
        const res = await getCurrentUser();
        const freshUserData = res.data;
        setUser(freshUserData);
        setIsAuthenticated(true);
      } catch (error) {
        // Si falla (401/403), no hay sesión válida
        setUser(null);
        setIsAuthenticated(false);

        if (error.response?.status === 401) {
          const currentPath = window.location.pathname;
          const isAuthPage = currentPath === '/login' || currentPath === '/register' ||
            currentPath === '/forgot-password' || currentPath === '/reset-password' ||
            currentPath === '/pending-approval';

          if (!isAuthPage) {
            sessionStorage.setItem('sessionExpired', 'true');
            window.location.href = '/login';
            return;
          }
        }
      }
      setIsLoading(false);
    };

    verifyAuth();
  }, []);


  const signup = async (user) => {
    try {
      const res = await import('../api/auth.api').then(module => module.registerSeller(user));
      return res.data;
    } catch (error) {
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
      // Token se maneja por cookie HttpOnly, solo guardamos datos del usuario en state
      const userData = res.data;
      setUser(userData);
      setIsAuthenticated(true);
      return res.data;
    } catch (error) {
      if (Array.isArray(error.response.data)) {
        setErrors(error.response.data);
      } else if (error.response?.data?.message) {
        setErrors([error.response.data.message]);
      } else if (typeof error.response.data === 'object') {
        setErrors(Object.values(error.response.data));
      } else {
        setErrors(["Login failed"]);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Ignorar errores al cerrar sesión
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const res = await getCurrentUser();
      const userData = res.data;
      setUser(userData);
      return userData;
    } catch (error) {
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