import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../auth/AuthPage';
import ForgotPasswordPage from '../auth/ForgotPasswordPage';
import ResetPasswordPage from '../auth/ResetPasswordPage';
import Dashboard from '../admin/pages/Dashboard';
import SellersList from '../admin/pages/SellersList';
import SellerDetails from '../admin/pages/SellerDetails';
import SalesReview from '../admin/pages/SalesReview';
import AdminSalesHistory from '../admin/pages/AdminSalesHistory';
import AdminReports from '../admin/pages/AdminReports';
import AdminSettings from '../admin/pages/AdminSettings';
import AdminNotificationsHistory from '../admin/pages/AdminNotificationsHistory';
import AdminRanking from '../admin/pages/AdminRanking';
import ProfileView from '../pages/ProfileView';
import SellerHome from '../seller/pages/SellerHome';
import SellerProfile from '../seller/pages/SellerProfile';
import SellerNotificationsHistory from '../seller/pages/SellerNotificationsHistory';
import SellerRanking from '../seller/pages/SellerRanking';
import SellerSales from '../seller/pages/SellerSales';
import SellerSupport from '../seller/pages/SellerSupport';
import SellerMisFiados from '../seller/pages/SellerMisFiados';
import SellerFiarUsuarios from '../seller/pages/SellerFiarUsuarios';
import PendingApproval from '../seller/pages/PendingApproval';

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Wait for auth to initialize
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // Get role from roles array (backend returns roles as array)
    const userRole = user?.roles?.[0] || user?.role;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user || !userRole) {
        return <Navigate to="/login" replace />;
    }

    // Si es Seller y está pendiente, redirigir a pending-approval
    if (userRole === 'SELLER' && user.pendingApproval) {
        return <Navigate to="/pending-approval" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        if (userRole === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === 'SELLER') {
            return <Navigate to="/seller/home" replace />;
        }
        return <div>No tienes permiso para acceder a esta página</div>;
    }

    // Verificar permiso específico (canCreditSelf, canCreditCustomers, etc.)
    if (requiredPermission && !user[requiredPermission]) {
        return <Navigate to="/seller/home" replace />;
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
                        <Route path="notifications" element={<AdminNotificationsHistory />} />
                        <Route path="ranking" element={<AdminRanking />} />
                        <Route path="profile/:id" element={<ProfileView />} />
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
                        <Route path="mis-fiados" element={
                            <ProtectedRoute requiredPermission="canCreditSelf">
                                <SellerMisFiados />
                            </ProtectedRoute>
                        } />
                        <Route path="fiar-usuarios" element={
                            <ProtectedRoute requiredPermission="canCreditCustomers">
                                <SellerFiarUsuarios />
                            </ProtectedRoute>
                        } />
                        <Route path="notificaciones" element={<SellerNotificationsHistory />} />
                        <Route path="ranking" element={<SellerRanking />} />
                        <Route path="perfil" element={<SellerProfile />} />
                        <Route path="profile/:id" element={<ProfileView />} />
                    </Routes>
                </ProtectedRoute>
            } />

            {/* Default */}
            <Route path="/*" element={<Navigate to="/login" />} />
        </Routes>
    )
}