import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { login as loginRequest, getCurrentUser, logout as logoutRequest, registerSeller } from '../api/auth.api';

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


  const signup = useCallback(async (userData) => {
    try {
      const res = await registerSeller(userData);
      return res.data;
    } catch (error) {
      if (Array.isArray(error.response?.data)) {
        setErrors(error.response.data);
      } else {
        setErrors([error.response?.data?.message || 'Error en el registro']);
      }
      throw error;
    }
  }, []);

  const signin = useCallback(async (userData) => {
    try {
      const res = await loginRequest(userData);
      const freshUser = res.data;
      setUser(freshUser);
      setIsAuthenticated(true);
      return res.data;
    } catch (error) {
      if (Array.isArray(error.response?.data)) {
        setErrors(error.response.data);
      } else if (error.response?.data?.message) {
        setErrors([error.response.data.message]);
      } else if (typeof error.response?.data === 'object') {
        setErrors(Object.values(error.response.data));
      } else {
        setErrors(['Error al iniciar sesion']);
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignorar errores al cerrar sesion
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      const freshUser = res.data;
      setUser(freshUser);
      return freshUser;
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  }, [logout]);

  const value = useMemo(() => ({
    signup,
    signin,
    logout,
    refreshUser,
    user,
    isAuthenticated,
    isLoading,
    errors,
  }), [signup, signin, logout, refreshUser, user, isAuthenticated, isLoading, errors]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};