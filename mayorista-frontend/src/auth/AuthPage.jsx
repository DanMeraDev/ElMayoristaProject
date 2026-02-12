import { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function AuthPage() {
  const { signin, signup, isAuthenticated, isLoading, user, errors: authErrors } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(location.pathname === '/login' || location.pathname === '/');

  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  useEffect(() => {
    const expired = sessionStorage.getItem('sessionExpired');
    const loginError = sessionStorage.getItem('loginError');

    if (loginError) {
      setLoginErrorMsg(loginError);
      sessionStorage.removeItem('loginError');
    } else if (expired === 'true') {
      setSessionExpiredMsg(true);
      sessionStorage.removeItem('sessionExpired');
      setTimeout(() => setSessionExpiredMsg(false), 5000);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/register' && isLogin) {
      setIsLogin(false);
    } else if (location.pathname === '/login' && !isLogin) {
      setIsLogin(true);
    }
  }, [location.pathname, isLogin]);


  useEffect(() => {
    if (isLoading) return;

    const isOnAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

    if (isAuthenticated && user && isOnAuthPage) {
      const userRole = user.roles?.[0] || user.role;

      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'SELLER' && user.pendingApproval) {
        // Pending sellers go directly to pending page
        navigate('/pending-approval', { replace: true });
      } else if (userRole === 'SELLER') {
        navigate('/seller/home', { replace: true });
      }
      // If role is unknown, don't redirect - stay on login page
    }
  }, [isAuthenticated, isLoading, user, location.pathname, navigate]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form default submission
    // Basic client-side validation could go here if needed
    // But we rely on backend or simple checks
    if (isLogin) {
      try {
        await signin({ email: formData.email, password: formData.password });
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        await signup(formData);
        navigate('/pending-approval');
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Function to switch modes and update URL
  const switchMode = (mode) => {
    setIsLogin(mode);
    navigate(mode ? '/login' : '/register');
  };

  return (
    <div className="min-h-screen h-screen bg-mayorista-surface flex items-center justify-center relative">

      {/* Form */}
      <div className="w-full flex items-center justify-center py-8 px-4 pb-24 relative z-10 overflow-auto">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 md:p-10 relative my-auto">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="El Mayorista Logo"
              className="h-14 object-contain"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-mayorista-text-primary mb-2">
              Bienvenido a El Mayorista
            </h2>
            <p className="text-mayorista-text-secondary text-sm">
              Inicia sesión o regístrate para continuar.
            </p>
          </div>

          {/* Login Error Message (e.g. Disabled Account) */}
          {loginErrorMsg && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{loginErrorMsg}</span>
            </div>
          )}

          {/* Session Expired Message */}
          {sessionExpiredMsg && (
            <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Tu sesión ha expirado. Por favor, inicia sesión nuevamente.</span>
            </div>
          )}

          {/* Error Messages */}
          {authErrors && authErrors.length > 0 && (
            <div className="mb-4">
              {authErrors.map((err, i) => (
                <div key={i} className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-2 text-sm">
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b-2 border-gray-200 mb-8">
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 text-center font-semibold transition-all relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-mayorista-red focus:ring-inset rounded-t-md ${isLogin
                ? 'text-mayorista-red'
                : 'text-mayorista-text-secondary'
                }`}
            >
              Iniciar Sesión
              {isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mayorista-red"></div>
              )}
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 text-center font-semibold transition-all relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-mayorista-red focus:ring-inset rounded-t-md ${!isLogin
                ? 'text-mayorista-red'
                : 'text-mayorista-text-secondary'
                }`}
            >
              Registrarse
              {!isLogin && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mayorista-red"></div>
              )}
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                  Nombre completo
                </label>
                <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                  <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md focus-within:border-mayorista-red">
                    <User className="text-mayorista-text-secondary w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="flex-1 px-4 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary rounded-r-md"
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                Correo electrónico
              </label>
              <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md">
                  <Mail className="text-mayorista-text-secondary w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="flex-1 px-4 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary rounded-r-md"
                  placeholder="ejemplo@elmayorista.com"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                  Número telefónico
                </label>
                <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                  <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md">
                    <Phone className="text-mayorista-text-secondary w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className="flex-1 px-4 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary rounded-r-md"
                    placeholder="+593 999 999 999"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-mayorista-text-primary text-sm font-semibold mb-2">
                Contraseña
              </label>
              <div className="relative flex border border-gray-200 rounded-md focus-within:border-mayorista-red focus-within:ring-1 focus-within:ring-mayorista-red">
                <div className="w-12 flex items-center justify-center bg-white border-r border-gray-200 rounded-l-md">
                  <Lock className="text-mayorista-text-secondary w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="flex-1 px-4 pr-12 py-3 focus:outline-none bg-white text-mayorista-text-primary placeholder:text-mayorista-text-secondary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-mayorista-text-secondary hover:text-mayorista-red transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-mayorista-red hover:underline transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3.5 rounded-md transition-all shadow-sm hover:shadow-md"
            >
              {isLogin ? 'Ingresar' : 'Registrarse'}
            </button>

            {!isLogin && (
              <p className="text-xs text-mayorista-text-secondary text-center">
                Al registrarte, aceptas nuestros términos y condiciones
              </p>
            )}
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-mayorista-text-secondary">
              {isLogin ? '¿Eres vendedor de El Mayorista?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={() => switchMode(!isLogin)}
                className="text-mayorista-red font-semibold hover:underline transition-colors"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-mayorista-white/90 backdrop-blur-sm border-t border-gray-200 py-3 text-center z-50">
        <p className="text-xs text-mayorista-text-secondary">© 2026 El Mayorista</p>
      </div>
    </div>
  );
}

export default AuthPage;

