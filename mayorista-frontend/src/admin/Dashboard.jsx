import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  CheckCircle,
  Settings,
  LogOut,
  Bell,
  Moon,
  Sun,
  DollarSign,
  Wallet,
  UserPlus,
  FileDown,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  Phone,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { getAllSellers, approveSeller, rejectSeller, getPendingSellers, getSalesUnderReview } from '../api/admin.api';
import AdminFooter from './components/AdminFooter';
import AdminSidebar from './components/AdminSidebar';

function Dashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingCommissions: 0,
    activeSellers: 0,
    pendingRequests: 0
  });
  const [allSellersData, setAllSellersData] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const sellersPerPage = 10;

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingSales, setPendingSales] = useState([]);

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

      console.log('API Response:', allSellersRes); // Debug log

      // Handle both array and paginated response (Spring Data Page)
      const sellersData = Array.isArray(allSellersRes.data)
        ? allSellersRes.data
        : (allSellersRes.data?.content || []);

      const pendingData = Array.isArray(pendingRes.data)
        ? pendingRes.data
        : (pendingRes.data?.content || []);

      const salesData = salesUnderReviewRes.data;
      const pendingSalesCount = salesData?.totalElements || 0;
      const pendingSalesList = salesData?.content || [];

      setSellers(sellersData);
      setPendingSales(pendingSalesList);

      // Load sales and commission stats for all approved sellers
      await loadSellersStats(sellersData.filter(s => !s.pendingApproval));

      setStats(prev => ({
        ...prev,
        activeSellers: sellersData.filter(s => !s.pendingApproval).length,
        pendingRequests: pendingSalesCount
      }));
    } catch (err) {
      console.error('Error loading sellers:', err);
      showNotification('error', 'Error al cargar vendedores');
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats (sales and commissions) for all sellers
  const loadSellersStats = async (approvedSellers) => {
    console.log('Loading stats for sellers:', approvedSellers);
    try {
      // Import getCommissionStats
      const { getCommissionStats } = await import('../api/reports.api');

      let totalSales = 0;
      let totalCommissions = 0;

      // For each approved seller, get their sales and commission stats
      for (const seller of approvedSellers) {
        const userId = seller.id;
        if (!userId) continue;

        console.log(`Loading stats for seller ${userId} (${seller.fullName})`);

        try {
          // Get commission stats for this seller
          const statsResponse = await getCommissionStats(userId);
          console.log(`Commission stats for ${userId}:`, statsResponse.data);

          if (statsResponse.data) {
            // Sum up all commissions (earned + received = total pending to pay)
            const sellerCommissions = (statsResponse.data.earnedCommission || 0) + (statsResponse.data.receivedCommission || 0);
            totalCommissions += sellerCommissions;
            console.log(`Total commissions for ${userId}: $${sellerCommissions}`);
          }

          // Get seller's sales to calculate total sales amount
          const salesResponse = await getUserSales(userId, 0, 1000); // Get all sales
          console.log(`Sales for ${userId}:`, salesResponse.data);

          const salesData = salesResponse.data;
          const salesList = salesData?.content || [];

          // Sum approved sales only
          const approvedSalesTotal = salesList
            .filter(sale => sale.status?.toUpperCase() === 'APPROVED')
            .reduce((acc, sale) => acc + (sale.total || sale.totalAmount || 0), 0);

          console.log(`Approved sales total for ${userId}: $${approvedSalesTotal}`);
          totalSales += approvedSalesTotal;
        } catch (err) {
          console.error(`Error loading stats for seller ${userId}:`, err);
          // Continue with other sellers
        }
      }

      console.log('Final totals - Sales:', totalSales, 'Commissions:', totalCommissions);

      setStats(prev => ({
        ...prev,
        totalSales: totalSales,
        pendingCommissions: totalCommissions
      }));
    } catch (err) {
      console.error('Error loading sellers stats:', err);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    let filtered = [...sellers];

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(s => s.pendingApproval);
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(s => !s.pendingApproval);
    }

    // Filter by search term
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
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        Aprobado
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
            {/* Mobile hamburger - always visible on mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 md:hidden"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop toggle - only when sidebar is closed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hidden md:block"
                title="Mostrar menú"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <span className="font-medium text-slate-900 dark:text-white">Dashboard Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {stats.pendingRequests > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-surface-dark rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {stats.pendingRequests} ventas pendientes de revisión
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {pendingSales.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pendingSales.map((sale) => (
                          <Link
                            key={sale.id}
                            to="/admin/sales-review"
                            onClick={() => setShowNotifications(false)}
                            className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  Revisar venta de {sale.seller?.fullName || 'Vendedor'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {sale.customerName} - ${sale.total?.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {new Date(sale.orderDate).toLocaleDateString('es-EC')}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay notificaciones</p>
                      </div>
                    )}
                  </div>

                  {pendingSales.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <Link
                        to="/admin/sales-review"
                        onClick={() => setShowNotifications(false)}
                        className="block text-center text-sm text-primary hover:text-primary/80 font-medium"
                      >
                        Ver todas las ventas
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header >

        {/* Content */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto flex flex-col">
          <div className="space-y-6 flex-1">
            {/* Notification */}
            {
              notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                  {notification.message}
                </div>
              )
            }

            {/* Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Resumen de operaciones y gestión del ciclo actual.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm shadow-red-200 dark:shadow-none"
                >
                  <RefreshCw className="w-5 h-5" />
                  Cierre de Ciclo
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Sales */}
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">+12.5%</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ventas del Ciclo Total</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${stats.totalSales.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</h3>
                </div>
              </div>

              {/* Pending Commissions */}
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Pendiente</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Comisiones por Liquidar</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${stats.pendingCommissions.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</h3>
                </div>
              </div>

              {/* Active Sellers */}
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">+2 nuevos</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vendedores Activos</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeSellers}</h3>
                </div>
              </div>

              {/* Pending Requests */}
              <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1 bg-red-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Acción req.</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Solicitudes Pendientes</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingRequests}</h3>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Footer */}
        <AdminFooter />
      </main >

      {/* Logout Modal */}
      {
        showLogoutModal && (
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
        )
      }
    </div >
  );
}

export default Dashboard;
