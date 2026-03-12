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
    LayoutDashboard,
    BarChart3,
    Settings,
    RefreshCw,
    CheckCircle,
    MapPin,
    RotateCcw,
    XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserById, getUserCommission, getUserSales, getPendingSellers, getSalesUnderReview, reviewSale } from '../../api/admin.api';
import AdminFooter from '../components/AdminFooter';
import SaleDetailModal from '../../components/SaleDetailModal';
import ReturnModal from '../components/ReturnModal';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';

function SellerDetails() {
    const { id } = useParams();
    const { user, logout } = useAuth();
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

    // Return modal
    const [returnModalSale, setReturnModalSale] = useState(null);

    // Review state
    const [isApproving, setIsApproving] = useState(null);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [notification, setNotification] = useState(null);

    // Auto-dismiss notification
    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => setNotification(null), 4000);
        return () => clearTimeout(timer);
    }, [notification]);

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

    const handleReturnSuccess = () => {
        setReturnModalSale(null);
        loadSales();
        loadCommission();
    };

    const handleApprove = async (sale) => {
        setIsApproving(sale.id);
        try {
            await reviewSale(sale.id, true);
            setNotification({ type: 'success', message: `Venta #${sale.orderNumber || sale.id} aprobada exitosamente.` });
            setSelectedSale(null);
            loadSales();
            loadCommission();
        } catch (err) {
            console.error('Error approving sale:', err);
            setNotification({ type: 'error', message: 'Error al aprobar la venta.' });
        } finally {
            setIsApproving(null);
        }
    };

    const handleReject = async (sale) => {
        if (!rejectionReason.trim()) {
            setNotification({ type: 'error', message: 'Debes ingresar un motivo de rechazo.' });
            return;
        }
        setIsApproving(sale.id);
        try {
            await reviewSale(sale.id, false, rejectionReason);
            setNotification({ type: 'success', message: `Venta #${sale.orderNumber || sale.id} rechazada.` });
            setSelectedSale(null);
            setRejectionReason('');
            setShowRejectForm(false);
            loadSales();
        } catch (err) {
            console.error('Error rejecting sale:', err);
            setNotification({ type: 'error', message: 'Error al rechazar la venta.' });
        } finally {
            setIsApproving(null);
        }
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
            case 'RETURNED':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
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
            case 'RETURNED':
                return 'Devuelta';
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
                <AdminTopbar
                    isSidebarOpen={isSidebarOpen}
                    onSidebarOpen={() => setIsSidebarOpen(true)}
                    title="Ventas del Vendedor"
                />

                {/* Content */}
                <div className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto">
                    {/* Seller Info Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
                            <div className="flex items-start gap-4">
                                {seller?.profilePhotoUrl ? (
                                    <img
                                        src={seller.profilePhotoUrl}
                                        alt={seller.fullName}
                                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold text-white">
                                            {seller?.fullName?.charAt(0)?.toUpperCase() || 'V'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{seller?.fullName}</h1>
                                    {seller?.nickname && (
                                        <p className="text-sm text-primary font-medium">@{seller.nickname}</p>
                                    )}
                                    <div className="mt-2 space-y-1">
                                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <Mail className="w-4 h-4" />
                                            {seller?.email}
                                        </p>
                                        <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <Phone className="w-4 h-4" />
                                            {seller?.phoneNumber || 'Sin teléfono'}
                                        </p>
                                        {seller?.city && (
                                            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                                <MapPin className="w-4 h-4" />
                                                {seller.city}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs px-2 py-1 rounded-full ${seller?.pendingApproval
                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {seller?.pendingApproval ? 'Pendiente de Aprobación' : 'Aprobado'}
                                        </span>
                                        <button
                                            onClick={() => navigate(`/admin/profile/${seller?.id}`)}
                                            className="text-xs text-primary hover:text-primary-hover font-medium hover:underline transition-colors"
                                        >
                                            Ver perfil completo
                                        </button>
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
                                {formatCurrency(commission ?? 0)}
                            </p>
                            <p className="text-sm opacity-75 mt-1">
                                {new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
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
                                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openSaleDetail(sale.id); }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Ver detalle"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {sale.status === 'UNDER_REVIEW' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApprove(sale); }}
                                                                disabled={isApproving === sale.id}
                                                                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Aprobar venta"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {sale.status === 'UNDER_REVIEW' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedSale(sale);
                                                                    setShowRejectForm(true);
                                                                }}
                                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Rechazar venta"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {sale.status === 'APPROVED' && !sale.commissionSettled && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setReturnModalSale(sale); }}
                                                                className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                                title="Procesar devolución"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
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
                onClose={() => { setSelectedSale(null); setShowRejectForm(false); setRejectionReason(''); }}
            >
                {selectedSale && selectedSale.status === 'UNDER_REVIEW' && (
                    <div className="space-y-3">
                        {showRejectForm ? (
                            <div className="space-y-3">
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Motivo del rechazo..."
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedSale)}
                                        disabled={isApproving === selectedSale.id}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isApproving === selectedSale.id ? 'Rechazando...' : 'Confirmar Rechazo'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedSale)}
                                    disabled={isApproving === selectedSale.id}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {isApproving === selectedSale.id ? 'Aprobando...' : 'Aprobar'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {selectedSale && selectedSale.status === 'APPROVED' && !selectedSale.commissionSettled && (
                    <button
                        onClick={() => { setSelectedSale(null); setReturnModalSale(selectedSale); }}
                        className="w-full px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Procesar Devolución
                    </button>
                )}
            </SaleDetailModal>

            {/* Return Modal */}
            {returnModalSale && (
                <ReturnModal
                    sale={returnModalSale}
                    onClose={() => setReturnModalSale(null)}
                    onSuccess={handleReturnSuccess}
                />
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
                    notification.type === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {notification.message}
                    <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default SellerDetails;
