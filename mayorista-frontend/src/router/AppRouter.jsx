import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../auth/AuthPage';
import ForgotPasswordPage from '../auth/ForgotPasswordPage';
import ResetPasswordPage from '../auth/ResetPasswordPage';
import Dashboard from '../admin/Dashboard';
import SellersList from '../admin/SellersList';
import SellerDetails from '../admin/SellerDetails';
import SalesReview from '../admin/SalesReview';
import AdminSalesHistory from '../admin/AdminSalesHistory';
import AdminReports from '../admin/AdminReports';
import AdminSettings from '../admin/AdminSettings';
import SellerHome from '../seller/SellerHome';
import SellerSales from '../seller/SellerSales';
import SellerSupport from '../seller/pages/SellerSupport';
import SellerMisFiados from '../seller/SellerMisFiados';
import SellerFiarUsuarios from '../seller/SellerFiarUsuarios';
import PendingApproval from '../seller/PendingApproval';

// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Wait for auth to initialize
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Get role from roles array (backend returns roles as array)
    const userRole = user?.roles?.[0] || user?.role;

    // Debug: log what we have
    console.log('ProtectedRoute check:', { isAuthenticated, user, userRole, allowedRoles, path: location.pathname });

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Safety check: if user exists but role is undefined
    if (!user || !userRole) {
        console.error('User authenticated but no role found:', user);
        return <Navigate to="/login" replace />;
    }

    // Si es Seller y está pendiente, redirigir a pending-approval
    if (userRole === 'SELLER' && user.pendingApproval) {
        return <Navigate to="/pending-approval" replace />;
    }

    // Check role - if doesn't match, go to appropriate default instead of /login to avoid loop
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.warn('Role mismatch:', { userRole, allowedRoles });
        // Redirect to appropriate page based on role instead of /login
        if (userRole === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === 'SELLER') {
            return <Navigate to="/seller/home" replace />;
        }
        // Last resort: show unauthorized
        return <div>No tienes permiso para acceder a esta página</div>;
    }

    return children;
};

export const AppRouter = () => {
    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="sellers" element={<SellersList />} />
                        <Route path="sellers/:id" element={<SellerDetails />} />
                        <Route path="sales-review" element={<SalesReview />} />
                        <Route path="sales-history" element={<AdminSalesHistory />} />
                        <Route path="reports" element={<AdminReports />} />
                        <Route path="settings" element={<AdminSettings />} />
                    </Routes>
                </ProtectedRoute>
            } />

            {/* Seller Routes */}
            <Route path="/seller/*" element={
                <ProtectedRoute allowedRoles={['SELLER']}>
                    <Routes>
                        <Route path="home" element={<SellerHome />} />
                        <Route path="ventas" element={<SellerSales />} />
                        <Route path="soporte" element={<SellerSupport />} />
                        <Route path="mis-fiados" element={<SellerMisFiados />} />
                        <Route path="fiar-usuarios" element={<SellerFiarUsuarios />} />
                    </Routes>
                </ProtectedRoute>
            } />

            {/* Default */}
            <Route path="/*" element={<Navigate to="/login" />} />
        </Routes>
    )
}