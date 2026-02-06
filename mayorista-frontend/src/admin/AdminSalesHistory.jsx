import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Eye,
    Calendar,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Bell,
    Moon,
    Sun,
    ShoppingBag,
    Search
} from 'lucide-react';
import { getAllSales, getSalesUnderReview } from '../api/admin.api';
import AdminFooter from './components/AdminFooter';
import AdminSidebar from './components/AdminSidebar';
import SaleDetailModal from '../components/SaleDetailModal';

function AdminSalesHistory() {
    const { user } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();

    // Sales state
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Modal state
    const [selectedSale, setSelectedSale] = useState(null);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

    useEffect(() => {
        loadSales();
        loadPendingCount();
    }, [page]);

    const loadSales = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await getAllSales(page, 10);
            const data = response.data;

            if (data.content) {
                setSales(data.content);
                setTotalPages(data.totalPages || 1);
            } else if (Array.isArray(data)) {
                setSales(data);
                setTotalPages(1);
            } else {
                setSales([]);
            }
        } catch (err) {
            console.error('Error loading sales:', err);
            setError('Error al cargar el historial de ventas.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadPendingCount = async () => {
        try {
            const response = await getSalesUnderReview(0, 1); // Just to get totalElements
            setPendingRequestsCount(response.data.totalElements || 0);
        } catch (err) {
            console.error('Error loading pending count:', err);
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

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
            case 'UNDER_REVIEW': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
            case 'REJECTED': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'Aprobada';
            case 'PENDING': return 'Pendiente';
            case 'UNDER_REVIEW': return 'En Revisión';
            case 'REJECTED': return 'Rechazada';
            default: return status || 'Desconocido';
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen flex transition-colors duration-200">
            {/* Sidebar */}
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                pendingRequestsCount={pendingRequestsCount}
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
                        <span className="font-medium text-slate-900 dark:text-white">Historial de Ventas Global</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <Bell className="w-5 h-5" />
                            {pendingRequestsCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
                            )}
                        </button>
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
                        {/* Title */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Ventas</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Todas las ventas de todos los vendedores.</p>
                        </div>

                        {/* Sales Table */}
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                            {/* Table */}
                            <div className="overflow-x-auto">
                                {isLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando historial...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-12">
                                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                        <p className="text-red-600 dark:text-red-400">{error}</p>
                                        <button onClick={loadSales} className="mt-4 text-primary hover:underline">
                                            Reintentar
                                        </button>
                                    </div>
                                ) : sales.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-slate-500 dark:text-slate-400">No hay ventas registradas.</p>
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
                                                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
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
                                                            {formatDate(sale.orderDate || sale.date || sale.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                                                            {getStatusLabel(sale.status)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button
                                                            onClick={() => setSelectedSale(sale)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-all shadow-sm"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            Ver
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

            {/* Sale Detail Modal */}
            <SaleDetailModal
                sale={selectedSale}
                onClose={() => setSelectedSale(null)}
            />
        </div>
    );
}

export default AdminSalesHistory;
