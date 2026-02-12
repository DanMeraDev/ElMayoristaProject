import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
    ChevronRight,
    ChevronLeft,
    Users,
    LogOut,
    Phone,
    Mail,
    DollarSign,
    ShoppingBag,
    Calendar,
    Eye,
    X,
    Moon,
    Sun,
    LayoutDashboard,
    BarChart3,
    Settings,
    RefreshCw,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { getUserById, getUserCommission, getUserSales, getPendingSellers, getSalesUnderReview } from '../../api/admin.api';
import AdminFooter from '../components/AdminFooter';
import SaleDetailModal from '../../components/SaleDetailModal';
import AdminSidebar from '../components/AdminSidebar';
import NotificationBell from '../../components/NotificationBell';

function SellerDetails() {
    const { id } = useParams();
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();

    const [seller, setSeller] = useState(null);
    const [commission, setCommission] = useState(null);
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [salesLoading, setSalesLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // Sale detail modal
    const [selectedSale, setSelectedSale] = useState(null);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [stats, setStats] = useState({ pendingRequests: 0 });

    useEffect(() => {
        loadSellerDetails();
        loadCommission();
        loadStats();
    }, [id]);

    useEffect(() => {
        loadSales();
    }, [id, currentPage]);

    const loadStats = async () => {
        try {
            const salesUnderReviewRes = await getSalesUnderReview(0, 1);
            const salesData = salesUnderReviewRes.data;
            setStats(prev => ({
                ...prev,
                pendingRequests: salesData?.totalElements || 0
            }));
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const loadSellerDetails = async () => {
        setIsLoading(true);
        try {
            const response = await getUserById(id);
            setSeller(response.data);
        } catch (err) {
            console.error('Error loading seller:', err);
            setError('Error al cargar los detalles del vendedor.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCommission = async () => {
        try {
            const response = await getUserCommission(id);
            setCommission(response.data);
        } catch (err) {
            console.error('Error loading commission:', err);
        }
    };

    const loadSales = async () => {
        setSalesLoading(true);
        try {
            const response = await getUserSales(id, currentPage, pageSize);
            const data = response.data;

            if (data.content) {
                setSales(data.content);
                setTotalPages(data.totalPages || 1);
            } else if (Array.isArray(data)) {
                setSales(data);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error loading sales:', err);
        } finally {
            setSalesLoading(false);
        }
    };

    const openSaleDetail = (saleId) => {
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            setSelectedSale(sale);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'APROBADA':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING':
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
            case 'EN_REVISION':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'REJECTED':
            case 'RECHAZADA':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'APROBADA':
                return 'Aprobada';
            case 'PENDING':
            case 'PENDIENTE':
                return 'Pendiente';
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
            case 'EN_REVISION':
                return 'En Revisión';
            case 'REJECTED':
            case 'RECHAZADA':
                return 'Rechazada';
            default:
                return status || 'Pendiente';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `$${(amount || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/admin/sellers')}
                        className="text-primary hover:underline"
                    >
                        Volver a la lista
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex transition-colors duration-200">
            {/* Sidebar */}
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                pendingRequestsCount={stats.pendingRequests}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                        <Link to="/admin/sellers" className="hover:text-primary transition-colors">Vendedores</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-medium text-slate-900 dark:text-white">{seller?.fullName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto">
                    {/* Seller Info Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl font-bold text-white">
                                        {seller?.fullName?.charAt(0)?.toUpperCase() || 'V'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{seller?.fullName}</h1>
                                    <div className="mt-2 space-y-1">
                                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <Mail className="w-4 h-4" />
                                            {seller?.email}
                                        </p>
                                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <Phone className="w-4 h-4" />
                                            {seller?.phoneNumber || 'Sin teléfono'}
                                        </p>
                                    </div>
                                    <div className="mt-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${seller?.pendingApproval
                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {seller?.pendingApproval ? 'Pendiente de Aprobación' : 'Aprobado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Commission Card */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5" />
                                <span className="text-sm font-medium opacity-90">Comisión del Mes</span>
                            </div>
                            <p className="text-3xl font-bold">
                                {formatCurrency(commission?.totalCommission || commission?.amount || 0)}
                            </p>
                            <p className="text-sm opacity-75 mt-1">
                                {commission?.month || new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Sales Table */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                    <ShoppingBag className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ventas</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Historial de ventas del vendedor</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {salesLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                                    <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando ventas...</p>
                                </div>
                            ) : sales.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400">No hay ventas registradas.</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Orden</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {sales.map((sale) => (
                                            <tr
                                                key={sale.id}
                                                onClick={() => openSaleDetail(sale.id)}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        #{sale.orderNumber || sale.id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {sale.customerName || sale.clientName || sale.customer?.name || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(sale.orderDate)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                    {formatCurrency(sale.totalAmount || sale.total)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sale.status)}`}>
                                                        {getStatusLabel(sale.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Eye className="w-5 h-5 text-slate-400" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {!salesLoading && totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Página {currentPage + 1} de {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                        disabled={currentPage === 0}
                                        className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={currentPage >= totalPages - 1}
                                        className="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <AdminFooter />
            </main>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowLogoutModal(false)}></div>
                        <div className="relative bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Cerrar Sesión</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">¿Estás seguro que deseas cerrar sesión?</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-red-700 rounded-lg transition-colors"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sale Detail Modal */}
            <SaleDetailModal
                sale={selectedSale}
                onClose={() => setSelectedSale(null)}
            />
        </div>
    );
}

export default SellerDetails;
