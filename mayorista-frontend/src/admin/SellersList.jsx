import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Users,
    ChevronRight,
    ChevronLeft,
    Search,
    LogOut,
    CheckCircle,
    MoreVertical,
    Mail,
    Phone,
    Bell,
    Moon,
    Sun,
    LayoutDashboard,
    BarChart3,
    Settings,
    RefreshCw,

    Eye,
    Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { getAllSellers, approveSeller, getPendingSellers, getSalesUnderReview, toggleSellerEnabled } from '../api/admin.api';
import AdminFooter from './components/AdminFooter';
import AdminSidebar from './components/AdminSidebar';

function SellersList() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [sellers, setSellers] = useState([]);
    const [filteredSellers, setFilteredSellers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedSellers, setSelectedSellers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        pendingRequests: 0
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const sellersPerPage = 10;

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openActionsMenu, setOpenActionsMenu] = useState(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const loadSellers = async () => {
        setIsLoading(true);
        try {
            const [allSellersRes, pendingRes, salesUnderReviewRes] = await Promise.all([
                getAllSellers(),
                getPendingSellers(),
                getSalesUnderReview(0, 1)
            ]);

            const sellersData = Array.isArray(allSellersRes.data)
                ? allSellersRes.data
                : (allSellersRes.data?.content || []);

            const pendingData = Array.isArray(pendingRes.data)
                ? pendingRes.data
                : (pendingRes.data?.content || []);

            const salesData = salesUnderReviewRes.data;
            const pendingSalesCount = salesData?.totalElements || 0;

            setSellers(sellersData);
            setStats(prev => ({
                ...prev,
                pendingRequests: pendingSalesCount
            }));
        } catch (err) {
            console.error('Error loading sellers:', err);
            showNotification('error', 'Error al cargar vendedores');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSellers();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenActionsMenu(null);
        if (openActionsMenu) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openActionsMenu]);

    useEffect(() => {
        let filtered = [...sellers];

        if (statusFilter === 'pending') {
            filtered = filtered.filter(s => s.pendingApproval);
        } else if (statusFilter === 'enabled') {
            filtered = filtered.filter(s => !s.pendingApproval && s.enabled);
        } else if (statusFilter === 'disabled') {
            filtered = filtered.filter(s => !s.pendingApproval && !s.enabled);
        }

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.phone?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredSellers(filtered);
        setCurrentPage(1);
    }, [sellers, searchTerm, statusFilter]);

    const handleSelectSeller = (sellerId) => {
        setSelectedSellers(prev =>
            prev.includes(sellerId)
                ? prev.filter(id => id !== sellerId)
                : [...prev, sellerId]
        );
    };

    const handleSelectAll = () => {
        if (selectedSellers.length === paginatedSellers.length) {
            setSelectedSellers([]);
        } else {
            setSelectedSellers(paginatedSellers.map(s => s.id));
        }
    };

    const handleApproveSeller = async (sellerId) => {
        try {
            await approveSeller(sellerId);
            await loadSellers();
            showNotification('success', 'Vendedor aprobado exitosamente');
        } catch (err) {
            console.error('Error approving seller:', err);
            showNotification('error', 'Error al aprobar vendedor');
        }
    };

    const handleToggleEnabled = async (sellerId, currentStatus) => {
        try {
            await toggleSellerEnabled(sellerId, !currentStatus);
            showNotification('success', `Vendedor ${!currentStatus ? 'habilitado' : 'deshabilitado'} exitosamente`);
            loadSellers();
            setOpenActionsMenu(null);
        } catch (error) {
            console.error('Error toggling seller status:', error);
            showNotification('error', 'Error al cambiar estado del vendedor');
        }
    };

    const handleBulkApprove = async () => {
        try {
            await Promise.all(selectedSellers.map(id => approveSeller(id)));
            await loadSellers();
            setSelectedSellers([]);
            showNotification('success', `${selectedSellers.length} vendedores aprobados`);
        } catch (err) {
            console.error('Error in bulk approve:', err);
            showNotification('error', 'Error en aprobación masiva');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Pagination
    const indexOfLastSeller = currentPage * sellersPerPage;
    const indexOfFirstSeller = indexOfLastSeller - sellersPerPage;
    const paginatedSellers = filteredSellers.slice(indexOfFirstSeller, indexOfLastSeller);
    const totalPages = Math.ceil(filteredSellers.length / sellersPerPage);

    const getStatusBadge = (seller) => {
        if (seller.pendingApproval) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                    Pendiente
                </span>
            );
        }

        if (seller.enabled) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Habilitado
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Deshabilitado
            </span>
        );
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
                        <span className="font-medium text-slate-900 dark:text-white">Gestión de Vendedores</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <Bell className="w-5 h-5" />
                            {stats.pendingRequests > 0 && (
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
                <div className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto">
                    {/* Notification */}
                    {notification && (
                        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {notification.message}
                        </div>
                    )}

                    {/* Sellers Management Table */}
                    <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                        {/* Table Header */}
                        <div className="p-5 border-b border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestión de Vendedores</h2>
                            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                                {/* Filter Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('pending')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === 'pending'
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Pendientes
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('enabled')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === 'enabled'
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Habilitados
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('disabled')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusFilter === 'disabled'
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Deshabilitados
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                        placeholder="Buscar vendedor..."
                                    />
                                </div>

                                {/* Bulk Actions */}
                                {selectedSellers.length > 0 && (
                                    <button
                                        onClick={handleBulkApprove}
                                        className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Aprobar ({selectedSellers.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedSellers.length === paginatedSellers.length && paginatedSellers.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-primary bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-primary dark:focus:ring-offset-slate-800 focus:ring-2 transition-all cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedor</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contacto</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500">Cargando...</td>
                                        </tr>
                                    ) : paginatedSellers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-500">No se encontraron vendedores</td>
                                        </tr>
                                    ) : (
                                        paginatedSellers.map((seller) => (
                                            <tr key={seller.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-4 px-6">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSellers.includes(seller.id)}
                                                        onChange={() => handleSelectSeller(seller.id)}
                                                        className="w-4 h-4 text-primary bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-primary dark:focus:ring-offset-slate-800 focus:ring-2 transition-all cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                                            {seller.fullName?.charAt(0)?.toUpperCase() || 'V'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{seller.fullName}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: #{seller.id?.substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                            {seller.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                            {seller.phoneNumber || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getStatusBadge(seller)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="relative flex items-center justify-end gap-2">
                                                        {seller.pendingApproval && (
                                                            <button
                                                                onClick={() => handleApproveSeller(seller.id)}
                                                                className="text-xs font-medium text-primary hover:text-red-700 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                Aprobar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionsMenu(openActionsMenu === seller.id ? null : seller.id);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                                                        >
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {openActionsMenu === seller.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-dark rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionsMenu(null);
                                                                        navigate(`/admin/sellers/${seller.id}`);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Ver Detalles
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleEnabled(seller.id, seller.enabled);
                                                                    }}
                                                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${seller.enabled
                                                                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                                        }`}
                                                                >
                                                                    {seller.enabled ? (
                                                                        <>
                                                                            <Ban className="w-4 h-4" />
                                                                            Deshabilitar
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Habilitar
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-surface-light dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-t border-border-light dark:border-border-dark sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-700 dark:text-slate-400">
                                        Mostrando <span className="font-medium">{indexOfFirstSeller + 1}</span> a{' '}
                                        <span className="font-medium">{Math.min(indexOfLastSeller, filteredSellers.length)}</span> de{' '}
                                        <span className="font-medium">{filteredSellers.length}</span> resultados
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        {[...Array(Math.min(totalPages, 3))].map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentPage(idx + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === idx + 1
                                                    ? 'z-10 bg-red-50 dark:bg-red-900/20 border-primary text-primary'
                                                    : 'bg-white dark:bg-slate-800 border-border-light dark:border-border-dark text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}
                                        {totalPages > 3 && (
                                            <span className="relative inline-flex items-center px-4 py-2 border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-700">
                                                ...
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
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
        </div>
    );
}

export default SellersList;
