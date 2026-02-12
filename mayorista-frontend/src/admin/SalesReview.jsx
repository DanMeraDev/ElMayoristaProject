import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Users,
    CheckCircle,
    XCircle,
    LogOut,
    X,
    Eye,
    Calendar,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    ImageIcon,
    ClipboardList,
    LayoutDashboard,
    BarChart3,
    Settings,
    RefreshCw,
    Moon,
    Sun,
    FileText,
    Mail,
    Phone,
    Check
} from 'lucide-react';
import SaleDetailModal from '../components/SaleDetailModal';
import { getSalesUnderReview, reviewSale } from '../api/admin.api';
import AdminNotificationsPanel from './components/AdminNotificationsPanel';
import NotificationBell from '../components/NotificationBell';
import AdminFooter from './components/AdminFooter';
import AdminSidebar from './components/AdminSidebar';

function SalesReview() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();

    // Sales state
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Review modal state
    const [selectedSale, setSelectedSale] = useState(null);
    const [isApproving, setIsApproving] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    // Notification state
    const [notification, setNotification] = useState(null);

    // Logout modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Notification panel state
    const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        pendingRequests: 0
    });

    useEffect(() => {
        loadSalesUnderReview();
    }, [page]);

    const loadSalesUnderReview = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await getSalesUnderReview(page, 10);
            const data = response.data;

            if (data.content) {
                setSales(data.content);
                setTotalPages(data.totalPages || 1);
                setStats(prev => ({ ...prev, pendingRequests: data.totalElements || data.content.length }));
            } else if (Array.isArray(data)) {
                setSales(data);
                setTotalPages(1);
                setStats(prev => ({ ...prev, pendingRequests: data.length }));
            } else {
                setSales([]);
            }
        } catch (err) {
            console.error('Error loading sales:', err);
            setError('Error al cargar las ventas pendientes de revisión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (sale) => {
        setIsApproving(sale.id);
        try {
            await reviewSale(sale.id, true);
            setSales(prev => prev.filter(s => s.id !== sale.id));
            showNotification('success', `Venta #${sale.orderNumber || sale.id} aprobada exitosamente.`);
            setSelectedSale(null);
            await loadSalesUnderReview(); // Refresh to update count
        } catch (err) {
            console.error('Error approving sale:', err);
            showNotification('error', 'Error al aprobar la venta.');
        } finally {
            setIsApproving(null);
        }
    };

    const handleReject = async (sale) => {
        if (!rejectionReason.trim()) {
            showNotification('error', 'Debes ingresar un motivo de rechazo.');
            return;
        }

        setIsApproving(sale.id);
        try {
            await reviewSale(sale.id, false, rejectionReason);
            setSales(prev => prev.filter(s => s.id !== sale.id));
            showNotification('success', `Venta #${sale.orderNumber || sale.id} rechazada.`);
            setSelectedSale(null);
            setRejectionReason('');
            setShowRejectForm(false);
            await loadSalesUnderReview(); // Refresh to update count
        } catch (err) {
            console.error('Error rejecting sale:', err);
            showNotification('error', 'Error al rechazar la venta.');
        } finally {
            setIsApproving(null);
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const openSaleModal = (sale) => {
        setSelectedSale(sale);
        setShowRejectForm(false);
        setRejectionReason('');
    };

    const closeSaleModal = () => {
        setSelectedSale(null);
        setShowRejectForm(false);
        setRejectionReason('');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                                className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                                title="Mostrar menú"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                        <span className="font-medium text-slate-900 dark:text-white">Revisar Ventas</span>
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
                <div className="p-4 sm:p-8 flex-1 overflow-y-auto flex flex-col">
                    <div className="space-y-6 flex-1">
                        {/* Notification */}
                        {notification && (
                            <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {notification.message}
                            </div>
                        )}

                        {/* Sales Review Table */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                            {/* Table Header */}
                            <div className="p-5 border-b border-border-light dark:border-border-dark">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ventas Pendientes de Revisión</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{sales.length} ventas en espera de aprobación</p>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                {isLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando ventas...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-12">
                                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                        <p className="text-red-600 dark:text-red-400">{error}</p>
                                        <button onClick={loadSalesUnderReview} className="mt-4 text-primary hover:underline">
                                            Reintentar
                                        </button>
                                    </div>
                                ) : sales.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">No hay ventas pendientes de revisión.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Orden</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedor</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                            {sales.map((sale) => (
                                                <tr key={sale.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            #{sale.orderNumber || sale.id}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                        {sale.sellerName || sale.seller?.fullName || '-'}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                        {sale.customerName || '-'}
                                                    </td>
                                                    <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                                                        {formatCurrency(sale.total || sale.totalAmount)}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(sale.orderDate || sale.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => openSaleModal(sale)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            Revisar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pagination */}
                            {!isLoading && totalPages > 1 && (
                                <div className="bg-surface-light dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-t border-border-light dark:border-border-dark sm:px-6">
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-slate-700 dark:text-slate-400">
                                                Página <span className="font-medium">{page + 1}</span> de <span className="font-medium">{totalPages}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                                    disabled={page === 0}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                    disabled={page >= totalPages - 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <AdminFooter />
            </main>

            {/* Sale Review Modal */}
            <SaleDetailModal
                sale={selectedSale}
                onClose={closeSaleModal}
            >
                <div>
                    {/* Reject Form */}
                    {showRejectForm && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <label className="block text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                                Motivo del Rechazo *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ingresa el motivo por el cual rechazas esta venta..."
                                rows={3}
                                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            />
                        </div>
                    )}

                    {/* Footer / Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={closeSaleModal}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>

                        {showRejectForm ? (
                            <>
                                <button
                                    onClick={() => setShowRejectForm(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={() => handleReject(selectedSale)}
                                    disabled={isApproving || !rejectionReason.trim()}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isApproving === selectedSale?.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Confirmar Rechazo
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors"
                                >
                                    <XCircle className="w-4 h-4 inline mr-1" />
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedSale)}
                                    disabled={isApproving}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isApproving === selectedSale?.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Aprobar Venta
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </SaleDetailModal>

            {/* Logout Confirmation Modal */}
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

            {/* Admin Notifications Panel */}
            <AdminNotificationsPanel
                isOpen={showNotificationsPanel}
                onClose={() => setShowNotificationsPanel(false)}
                pendingSales={sales}
                onReviewSale={(sale) => setSelectedSale(sale)}
            />
        </div>
    );
}

export default SalesReview;
