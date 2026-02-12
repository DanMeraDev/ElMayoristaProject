import { useEffect, useState } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function PendingApproval() {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  // Check if user is approved and redirect
  useEffect(() => {
    // Only check if authenticated - unauthenticated users just registered and that's ok
    if (isAuthenticated && user) {
      // If user is not pending anymore, redirect to seller home
      if (user.pendingApproval === false) {
        const userRole = user.roles?.[0] || user.role;
        if (userRole === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/seller/home', { replace: true });
        }
      }
    }
  }, [user, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Refresh user status from backend
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    setRefreshError('');
    try {
      await refreshUser();
      // The useEffect will handle redirect if approved
    } catch (error) {
      setRefreshError('Error al verificar. Intenta de nuevo.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-mayorista-surface flex items-center justify-center relative">
      {/* Main Content */}
      <div className="w-full flex items-center justify-center py-8 px-4 pb-24 relative z-10">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 md:p-10 relative">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="El Mayorista Logo"
              className="h-14 object-contain"
            />
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-mayorista-text-primary text-center mb-3">
            Cuenta Pendiente de Aprobación
          </h1>

          {/* Description */}
          <p className="text-mayorista-text-secondary text-center mb-4">
            Tu solicitud de registro ha sido recibida y está siendo revisada por nuestro equipo.
          </p>

          <p className="text-mayorista-text-secondary text-center text-sm mb-8">
            Te notificaremos por correo electrónico una vez que tu cuenta sea aprobada.
            Este proceso puede tomar hasta <span className="font-semibold text-mayorista-text-primary">24-48 horas hábiles</span>.
          </p>

          {/* Info Card */}
          <div className="bg-mayorista-surface rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-mayorista-text-primary text-sm mb-2">
              ¿Qué sucede después?
            </h3>
            <ul className="text-sm text-mayorista-text-secondary space-y-2">
              <li className="flex items-start">
                <span className="text-mayorista-red mr-2">•</span>
                Recibirás un correo de confirmación cuando tu cuenta sea aprobada.
              </li>
              <li className="flex items-start">
                <span className="text-mayorista-red mr-2">•</span>
                Podrás acceder a todas las funciones de vendedor.
              </li>
              <li className="flex items-start">
                <span className="text-mayorista-red mr-2">•</span>
                Si tienes dudas, contacta a soporte.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {refreshError && (
              <div className="bg-red-100 text-red-700 text-sm px-3 py-2 rounded">
                {refreshError}
              </div>
            )}

            {isAuthenticated ? (
              <>
                <button
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                  className="w-full flex items-center justify-center gap-2 bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3 rounded-md transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Verificando...' : 'Verificar estado'}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-mayorista-text-primary font-semibold py-3 rounded-md transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-lg mb-2">
                  <p className="font-medium">¿Ya fuiste aprobado?</p>
                  <p className="text-blue-600">Inicia sesión para acceder a tu cuenta de vendedor.</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 bg-mayorista-red hover:bg-opacity-90 text-white font-semibold py-3 rounded-md transition-all"
                >
                  Iniciar sesión
                </button>
              </>
            )}
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

export default PendingApproval;