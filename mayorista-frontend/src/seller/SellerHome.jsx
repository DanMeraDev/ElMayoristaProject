import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Camera,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  LogOut,
  Home,
  ShoppingBag,
  Percent,
  X,
  Upload,
  Loader2,
  Eye,
  Calendar,
  ImageIcon,
  Menu,
  LayoutDashboard,
  Receipt,
  Settings,
  HelpCircle,
  Moon,
  TrendingUp,
  Wallet,
  Filter,
  Sun
} from 'lucide-react';
import { getMySales, getMyCommission, getCommissionStats, getMyProfile, getSaleDetails, registerPaymentWithReceipt } from '../api/reports.api';
import SellerSidebar from './components/SellerSidebar';
import SellerFooter from './components/SellerFooter';
import SalesUploadModal from './components/SalesUploadModal';
import PendingSalesPanel from './components/PendingSalesPanel';
import NotificationBell from '../components/NotificationBell';


function SellerHome() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const receiptInputRef = useRef(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Sales history state
  const [mySales, setMySales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(0);
  const [salesTotalPages, setSalesTotalPages] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);

  // Receipt upload state
  const [saleForReceipt, setSaleForReceipt] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState('');

  // Payment state for partial payments
  const [paymentType, setPaymentType] = useState('FULL'); // 'FULL' or 'PARTIAL'
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [salePaymentInfo, setSalePaymentInfo] = useState(null);
  const [loadingSaleInfo, setLoadingSaleInfo] = useState(false);

  // Pending sales panel state
  const [showPendingSalesPanel, setShowPendingSalesPanel] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sales filter state
  const [salesStatusFilter, setSalesStatusFilter] = useState('ALL');
  const [salesSortBy, setSalesSortBy] = useState('date_newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Commission state
  const [monthlyCommission, setMonthlyCommission] = useState(0);
  // New state for detailed commission stats
  const [commissionStats, setCommissionStats] = useState({
    earnedCommission: 0,
    pendingReviewCommission: 0,
    pendingPaymentCommission: 0
  });
  const [commissionPercentage, setCommissionPercentage] = useState(5); // Default 5% until loaded

  // Calculate pending sales count (PENDING or REJECTED status AND not fully paid)
  const pendingSalesCount = mySales.filter(
    sale => (sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID'
  ).length;

  // Computed statistics from sales data
  const computedStats = {
    // Total sales amount for the cycle
    totalSalesAmount: mySales.reduce((acc, sale) => acc + (sale.total || sale.totalAmount || 0), 0),

    // Count of sales by status
    approvedSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'APPROVED').length,
    underReviewSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'UNDER_REVIEW' || sale.status?.toUpperCase() === 'IN_REVIEW').length,
    pendingSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'PENDING').length,
    rejectedSalesCount: mySales.filter(sale => sale.status?.toUpperCase() === 'REJECTED').length,

    // Commission calculations based on status
    approvedCommission: mySales
      .filter(sale => sale.status?.toUpperCase() === 'APPROVED')
      .reduce((acc, sale) => acc + ((sale.total || sale.totalAmount || 0) * commissionPercentage / 100), 0),

    underReviewCommission: mySales
      .filter(sale => sale.status?.toUpperCase() === 'UNDER_REVIEW' || sale.status?.toUpperCase() === 'IN_REVIEW')
      .reduce((acc, sale) => acc + ((sale.total || sale.totalAmount || 0) * commissionPercentage / 100), 0),

    pendingCommission: mySales
      .filter(sale => sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED')
      .reduce((acc, sale) => acc + ((sale.total || sale.totalAmount || 0) * commissionPercentage / 100), 0),
  };

  // Mock data - replace with real API calls
  const stats = {
    earnedCommission: 721.50,
    pendingCommission: 280.00,
    pendingReceipts: 5,
    overduePayments: 5,
    overdueAmount: 482.00,
  };

  const recentActivities = [
    {
      type: 'overdue',
      message: 'Tienes 5 pagos atrasados',
      amount: 482.00,
      badge: '$482.00',
      time: null
    },
    {
      type: 'sale',
      message: 'Tienes Venta (PDF)',
      amount: 521.00,
      badge: '$482.00',
      time: null
    },
    {
      type: 'pending',
      message: '3 ventas esperando revisión',
      subtext: 'Carga las fotos para verificar las comis.',
      amount: 280.00,
      badge: '$280.00',
      time: null
    },
    {
      type: 'success',
      message: 'Felicitaciones, recibiste comisión:',
      detail: 'Venta #00152',
      amount: 314.00,
      badge: '$314.00',
      time: 'Hace 4 horas'
    },
  ];

  // Load user profile to get commission percentage
  const loadUserProfile = async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;

    try {
      const response = await getMyProfile(userId);
      const profile = response.data;

      // Get commission percentage from profile - check multiple possible field names
      const percentage = profile?.commissionPercentage ?? profile?.commission ?? profile?.commissionRate ?? 5;
      setCommissionPercentage(percentage);
      console.log('Loaded commission percentage:', percentage);
    } catch (err) {
      console.error('Error loading user profile:', err);
      // Keep default 5% on error
    }
  };

  // Load data on mount
  useEffect(() => {
    const userId = user?.userId || user?.id;
    if (userId) {
      loadUserProfile();
      loadMySales();
      loadMyCommission();
    }
  }, [salesPage, user?.id]);

  const loadMySales = async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;

    setSalesLoading(true);
    try {
      const response = await getMySales(userId, salesPage, 5);
      const data = response.data;

      if (data.content) {
        setMySales(data.content);
        setSalesTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setMySales(data);
        setSalesTotalPages(1);
      } else {
        setMySales(data.sales || data.ventas || []);
      }
    } catch (err) {
      console.error('Error loading sales:', err);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadMyCommission = async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;

    try {
      // Load simple commission (legacy but kept for safety/fallback)
      const simpleResponse = await getMyCommission(userId);
      let commissionValue = 0;
      if (typeof simpleResponse.data === 'number') {
        commissionValue = simpleResponse.data;
      } else if (simpleResponse.data?.totalCommission !== undefined) {
        commissionValue = simpleResponse.data.totalCommission;
      } else if (simpleResponse.data?.amount !== undefined) {
        commissionValue = simpleResponse.data.amount;
      }
      setMonthlyCommission(commissionValue);

      // Load detailed stats
      const statsResponse = await getCommissionStats(userId);
      if (statsResponse.data) {
        setCommissionStats(statsResponse.data);
      }

    } catch (err) {
      console.error('Error loading commission:', err);
      // Don't reset to 0 here to avoid flashing if one call fails but other works
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
      case 'APPROVED':
      case 'APROBADA':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
      case 'PENDIENTE':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
      case 'UNDER_REVIEW':
      case 'IN_REVIEW':
      case 'EN_REVISION':
        return 'bg-blue-100 text-blue-700';
      case 'REJECTED':
      case 'RECHAZADA':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'Aprobada';
      case 'PENDING': return 'Pendiente';
      case 'UNDER_REVIEW': return 'En Revisión';
      case 'REJECTED': return 'Rechazada';
      default: return status || 'Pendiente';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUploadSuccess = (uploadData) => {
    loadMySales();
    loadMyCommission();
  };

  // Receipt upload handlers
  const openReceiptModal = async (sale, e) => {
    e?.stopPropagation();
    setSaleForReceipt(sale);
    setReceiptFile(null);
    setReceiptUploadError('');
    setPaymentType('FULL');
    setPaymentAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentNotes('');
    setSalePaymentInfo(null);

    // Fetch sale details to get payment info
    setLoadingSaleInfo(true);
    try {
      const response = await getSaleDetails(sale.id);
      const saleData = response.data;
      setSalePaymentInfo({
        total: saleData.total || saleData.totalAmount || sale.total || sale.totalAmount || 0,
        totalPaid: saleData.totalPaid || 0,
        remainingAmount: saleData.remainingAmount ?? (saleData.total || saleData.totalAmount || sale.total || sale.totalAmount || 0),
        paymentStatus: saleData.paymentStatus || 'UNPAID'
      });
    } catch (error) {
      console.error('Error fetching sale details:', error);
      // Use sale data as fallback
      setSalePaymentInfo({
        total: sale.total || sale.totalAmount || 0,
        totalPaid: 0,
        remainingAmount: sale.total || sale.totalAmount || 0,
        paymentStatus: 'UNPAID'
      });
    } finally {
      setLoadingSaleInfo(false);
    }
  };

  const handleReceiptSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setReceiptUploadError('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.');
        return;
      }
      setReceiptFile(file);
      setReceiptUploadError('');
    }
  };

  // Calculate the actual payment amount based on type
  const getPaymentAmountToRegister = () => {
    if (!salePaymentInfo) return 0;
    if (paymentType === 'FULL') {
      return salePaymentInfo.remainingAmount;
    }
    return parseFloat(paymentAmount) || 0;
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile || !saleForReceipt) return;

    const amountToRegister = getPaymentAmountToRegister();

    // Validate payment amount
    if (amountToRegister <= 0) {
      setReceiptUploadError('El monto del pago debe ser mayor a 0.');
      return;
    }

    if (salePaymentInfo && amountToRegister > salePaymentInfo.remainingAmount) {
      setReceiptUploadError(`El monto no puede exceder el saldo pendiente de ${formatCurrency(salePaymentInfo.remainingAmount)}.`);
      return;
    }

    setIsUploadingReceipt(true);
    setReceiptUploadError('');

    try {
      // Register payment with receipt in a single call
      await registerPaymentWithReceipt(
        saleForReceipt.id,
        amountToRegister,
        paymentMethod,
        paymentNotes || (paymentType === 'FULL' ? 'Pago completo' : `Abono parcial de ${formatCurrency(amountToRegister)}`),
        receiptFile
      );

      closeReceiptModal();
      loadMySales();
    } catch (error) {
      console.error('Receipt upload error:', error);
      if (error.response?.status === 400) {
        setReceiptUploadError('Error en el pago o archivo inválido. Intenta de nuevo.');
      } else if (error.response?.status === 401) {
        setReceiptUploadError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setReceiptUploadError(error.response?.data?.message || 'Error al procesar el pago. Intenta de nuevo.');
      }
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const closeReceiptModal = () => {
    setSaleForReceipt(null);
    setReceiptFile(null);
    setReceiptUploadError('');
    setPaymentType('FULL');
    setPaymentAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentNotes('');
    setSalePaymentInfo(null);
    setLoadingSaleInfo(false);
  };

  // Filtered and sorted sales for the preview table
  const filteredSales = mySales
    .filter(sale => {
      if (salesStatusFilter === 'ALL') return true;
      return sale.status?.toUpperCase() === salesStatusFilter;
    })
    .sort((a, b) => {
      switch (salesSortBy) {
        case 'date_oldest': {
          const dateA = new Date(a.orderDate || a.date || a.createdAt || 0);
          const dateB = new Date(b.orderDate || b.date || b.createdAt || 0);
          return dateA - dateB;
        }
        case 'price_highest': {
          return (b.total || b.totalAmount || 0) - (a.total || a.totalAmount || 0);
        }
        case 'price_lowest': {
          return (a.total || a.totalAmount || 0) - (b.total || b.totalAmount || 0);
        }
        default: { // date_newest
          const dateA = new Date(a.orderDate || a.date || a.createdAt || 0);
          const dateB = new Date(b.orderDate || b.date || b.createdAt || 0);
          return dateB - dateA;
        }
      }
    });

  const activeFilterCount = (salesStatusFilter !== 'ALL' ? 1 : 0) + (salesSortBy !== 'date_newest' ? 1 : 0);

  // Use the commission percentage loaded from user profile API
  const userCommission = commissionPercentage;

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 min-h-screen transition-colors duration-200">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        {/* Sidebar */}
        <SellerSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          user={user}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* Main Content Area */}
        {/* Main Content Area */}
        <main className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          {/* Top Header */}
          {/* Top Header */}
          <header className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-border-dark h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`flex mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400 ${isSidebarOpen ? 'md:hidden' : ''}`}
                title={isSidebarOpen ? "Cerrar menú" : "Mostrar menú"}
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard Vendedor</h1>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden md:flex items-center bg-gray-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 transition-colors">
                <Percent className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-bold text-gray-700 dark:text-slate-200">Mi Comisión: <span className="text-primary">{userCommission}%</span></span>
              </div>
              <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden md:block"></div>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-400 hover:text-primary dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NotificationBell />
            </div>
          </header>

          {/* Main Content */}
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resumen Operativo</h2>
                <p className="text-gray-500 dark:text-slate-400 mt-1">Visión general de tu rendimiento y ventas.</p>
              </div>
            </div>
            {/* Stats Cards Grid - Full Width */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Ventas del Ciclo */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-border-dark shadow-soft hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-100 dark:border-green-800">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    +
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Ventas del Ciclo</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(computedStats.totalSalesAmount)}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{mySales.length} {mySales.length === 1 ? 'venta' : 'ventas'} registradas</p>
              </div>

              {/* Comisiones por Liquidar (Aprobadas) */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-border-dark shadow-soft hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-green-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-white bg-green-500 px-2 py-1 rounded-full">
                    Aprobado
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Comisiones por Liquidar</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(commissionStats.earnedCommission || computedStats.approvedCommission)}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{computedStats.approvedSalesCount} {computedStats.approvedSalesCount === 1 ? 'venta aprobada' : 'ventas aprobadas'}</p>
              </div>

              {/* Comisiones en Revisión */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-border-dark shadow-soft hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                    En Revisión
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Comisiones en Revisión</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(commissionStats.pendingReviewCommission || computedStats.underReviewCommission)}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{computedStats.underReviewSalesCount} {computedStats.underReviewSalesCount === 1 ? 'venta en revisión' : 'ventas en revisión'}</p>
              </div>

              {/* Comisiones Pendientes */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-border-dark shadow-soft hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute right-0 top-0 h-full w-1 bg-orange-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                    Pendiente
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Comisiones Pendientes</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(commissionStats.pendingPaymentCommission || computedStats.pendingCommission)}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{computedStats.pendingSalesCount + computedStats.rejectedSalesCount} {(computedStats.pendingSalesCount + computedStats.rejectedSalesCount) === 1 ? 'venta pendiente' : 'ventas pendientes'}</p>
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accesos Rápidos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nueva Venta */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group bg-white dark:bg-surface-dark"
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Nueva Venta</span>
                  <span className="text-sm text-gray-500 dark:text-slate-400 mt-2 text-center">Registrar una nueva transacción en el sistema</span>
                </button>

                {/* Cargar Comprobante */}
                <button
                  onClick={() => setShowPendingSalesPanel(true)}
                  className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group bg-white dark:bg-surface-dark relative"
                >
                  <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600 dark:text-blue-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Cargar Comprobante</span>
                  <span className="text-sm text-gray-500 dark:text-slate-400 mt-2 text-center">Subir comprobantes de pago pendientes</span>
                  {pendingSalesCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {pendingSalesCount}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Sales Preview Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-border-dark shadow-soft overflow-hidden transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-border-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Previsualización de Mis Ventas</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Últimos movimientos registrados en este ciclo.</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border flex items-center transition-colors ${activeFilterCount > 0
                        ? 'text-primary bg-red-50 dark:bg-red-900/20 border-primary dark:border-red-700'
                        : 'text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700'
                        }`}
                    >
                      <Filter className="w-4 h-4 mr-1" />
                      Filtrar
                      {activeFilterCount > 0 && (
                        <span className="ml-1.5 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>
                      )}
                    </button>
                    {showFilterDropdown && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-200 dark:border-border-dark z-40 p-4 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estado</label>
                            <select
                              value={salesStatusFilter}
                              onChange={(e) => setSalesStatusFilter(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value="ALL">Todos</option>
                              <option value="PENDING">Pendiente</option>
                              <option value="UNDER_REVIEW">En Revision</option>
                              <option value="APPROVED">Aprobada</option>
                              <option value="REJECTED">Rechazada</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ordenar por</label>
                            <select
                              value={salesSortBy}
                              onChange={(e) => setSalesSortBy(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value="date_newest">Fecha: mas recientes</option>
                              <option value="date_oldest">Fecha: mas antiguas</option>
                              <option value="price_highest">Monto: mayor a menor</option>
                              <option value="price_lowest">Monto: menor a mayor</option>
                            </select>
                          </div>
                          {activeFilterCount > 0 && (
                            <button
                              onClick={() => { setSalesStatusFilter('ALL'); setSalesSortBy('date_newest'); }}
                              className="w-full text-sm text-primary hover:text-primary-hover font-medium py-1.5 transition-colors"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <Link
                    to="/seller/ventas"
                    className="px-3 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-slate-700 hover:bg-gray-900 dark:hover:bg-slate-600 rounded-lg flex items-center transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Todo
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                {salesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mayorista-red mx-auto"></div>
                    <p className="mt-4 text-gray-500 dark:text-slate-400">Cargando ventas...</p>
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    {mySales.length === 0 ? (
                      <>
                        <p className="text-gray-500 dark:text-slate-400">No tienes ventas registradas aun.</p>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="mt-3 px-4 py-2 bg-mayorista-red text-white rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                          Subir tu primera venta
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500 dark:text-slate-400">No hay ventas que coincidan con el filtro.</p>
                        <button
                          onClick={() => { setSalesStatusFilter('ALL'); setSalesDateSort('newest'); }}
                          className="mt-3 px-4 py-2 text-primary hover:text-primary-hover font-medium transition-colors"
                        >
                          Limpiar filtros
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Orden
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Total Venta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Mi Comisión
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                      {filteredSales.map((sale) => (
                        <tr
                          key={sale.id}
                          onClick={() => setSelectedSale(sale)}
                          className="hover:bg-gray-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-800 dark:text-white">
                              #{sale.orderNumber || sale.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(sale.orderDate || sale.date || sale.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                            {sale.customerName || '-'}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                            {formatCurrency(sale.total || sale.totalAmount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${sale.commissionAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                              {sale.commissionAmount > 0 ? formatCurrency(sale.commissionAmount) : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${getStatusColor(sale.status)}`}>
                                {getStatusLabel(sale.status)}
                              </span>
                              {sale.status?.toUpperCase() === 'REJECTED' && sale.rejectionReason && (
                                <span className="text-xs text-red-600 max-w-[150px] truncate" title={sale.rejectionReason}>
                                  ⚠️ {sale.rejectionReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID' ? (
                              <button
                                onClick={(e) => openReceiptModal(sale, e)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                                title="Subir comprobante de pago"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Subir
                              </button>
                            ) : sale.paymentStatus === 'PAID' ? (
                              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                                ✓ Pagado
                              </span>
                            ) : (
                              <Eye className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!salesLoading && salesTotalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 dark:border-border-dark flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Página {salesPage + 1} de {salesTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSalesPage(p => Math.max(0, p - 1))}
                      disabled={salesPage === 0}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <button
                      onClick={() => setSalesPage(p => Math.min(salesTotalPages - 1, p + 1))}
                      disabled={salesPage >= salesTotalPages - 1}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-slate-300 font-medium transition-colors"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-border-dark bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs text-center text-gray-500 dark:text-slate-400">Mostrando {filteredSales.length} de {mySales.length} transacciones.{activeFilterCount > 0 && ' (filtrado)'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <SellerFooter />
        </main>

        {/* Sale Detail Modal */}
        {
          selectedSale && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors">
                <div className="sticky top-0 bg-white dark:bg-surface-dark px-6 py-4 border-b border-gray-100 dark:border-border-dark flex items-center justify-between z-10">
                  <h3 className="text-lg font-bold text-mayorista-text-primary dark:text-white">
                    Venta #{selectedSale.orderNumber || selectedSale.id}
                  </h3>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Sale Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Cliente</p>
                      <p className="font-medium text-gray-800 dark:text-white">{selectedSale.customerName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Fecha</p>
                      <p className="font-medium text-gray-800 dark:text-white">{formatDate(selectedSale.date || selectedSale.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Estado</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedSale.status)}`}>
                        {getStatusLabel(selectedSale.status)}
                      </span>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Subtotal</span>
                      <span className="text-gray-800 dark:text-white">{formatCurrency(selectedSale.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-300">Envío</span>
                      <span className="text-gray-800 dark:text-white">{formatCurrency(selectedSale.shippingCost || selectedSale.shipping || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                      <span className="text-gray-800 dark:text-white">Total Venta</span>
                      <span className="text-mayorista-red">{formatCurrency(selectedSale.totalAmount || selectedSale.total)}</span>
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-400">Mi Comisión ({selectedSale.commissionPercentage || userCommission}%)</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {formatCurrency(selectedSale.commissionAmount)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500 dark:text-green-400" />
                    </div>
                  </div>

                  {/* Receipt Image */}
                  {selectedSale.receiptImageUrl && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Comprobante</p>
                      <img
                        src={selectedSale.receiptImageUrl}
                        alt="Comprobante"
                        className="rounded-lg max-w-full h-auto border border-gray-200 dark:border-slate-700"
                      />
                    </div>
                  )}

                  {/* Report PDF */}
                  {selectedSale.reportPdfUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500 dark:text-slate-400">Reporte PDF</p>
                        <a
                          href={selectedSale.reportPdfUrl}
                          download={`Reporte-${selectedSale.orderNumber || selectedSale.id}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3 h-3" />
                          Descargar PDF
                        </a>
                      </div>
                      <iframe
                        src={selectedSale.reportPdfUrl}
                        width="100%"
                        height="400px"
                        className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white"
                        title={`Reporte de Venta ${selectedSale.orderNumber || selectedSale.id}`}
                      >
                        Cargando PDF...
                      </iframe>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-border-dark flex justify-end">
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Logout Confirmation Modal */}
        {
          showLogoutModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-mayorista-text-primary dark:text-white">
                    Cerrar Sesión
                  </h3>
                </div>

                <p className="text-mayorista-text-secondary dark:text-slate-300 mb-6">
                  ¿Estás seguro que deseas cerrar sesión?
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="px-4 py-2 text-mayorista-text-secondary dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-mayorista-red hover:bg-opacity-90 text-white font-medium rounded-md transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {/* Upload PDF Modal */}
        <SalesUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* Pending Sales Panel */}
        <PendingSalesPanel
          isOpen={showPendingSalesPanel}
          onClose={() => setShowPendingSalesPanel(false)}
          pendingSales={mySales.filter(sale => (sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID')}
          onUploadReceipt={openReceiptModal}
        />

        {/* Receipt Upload Modal */}
        {
          saleForReceipt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-mayorista-text-primary dark:text-white">
                        Registrar Pago y Comprobante
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Venta #{saleForReceipt.orderNumber || saleForReceipt.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeReceiptModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Rejection reason warning */}
                  {saleForReceipt.status?.toUpperCase() === 'REJECTED' && saleForReceipt.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <p className="text-sm font-medium">Motivo del rechazo anterior:</p>
                      <p className="text-sm">{saleForReceipt.rejectionReason}</p>
                    </div>
                  )}

                  {/* Payment Info Card */}
                  {loadingSaleInfo ? (
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Cargando información de pago...</p>
                    </div>
                  ) : salePaymentInfo && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Estado del Pago
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-slate-400">Total Venta</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(salePaymentInfo.total)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-slate-400">Pagado</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-500">{formatCurrency(salePaymentInfo.totalPaid)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-slate-400">Pendiente</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-500">{formatCurrency(salePaymentInfo.remainingAmount)}</p>
                        </div>
                      </div>
                      {salePaymentInfo.paymentStatus === 'PAID' && salePaymentInfo.remainingAmount <= 0 && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Pago completado - En revisión</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Esta venta ya ha sido pagada en su totalidad y está pendiente de revisión por el administrador.</p>
                        </div>
                      )}
                      {salePaymentInfo.totalPaid > 0 && salePaymentInfo.paymentStatus !== 'PAID' && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                          <span className={`text-xs px-2 py-1 rounded-full ${salePaymentInfo.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                            }`}>
                            {salePaymentInfo.paymentStatus === 'PARTIALLY_PAID' ? '◐ Pago Parcial' : 'Sin Pagar'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment already complete - show message and disable form */}
                  {salePaymentInfo && salePaymentInfo.remainingAmount <= 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="font-medium text-green-800 dark:text-green-300">¡Pago Completo!</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">Esta venta ya está completamente pagada y está en revisión.</p>
                    </div>
                  )}

                  {/* Payment Type Selection - only show if there's remaining amount */}
                  {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Tipo de Pago
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentType('FULL')}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${paymentType === 'FULL'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 dark:text-slate-300'
                            }`}
                        >
                          <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${paymentType === 'FULL' ? 'text-green-500' : 'text-gray-400 dark:text-slate-500'}`} />
                          <p className="font-medium text-sm">Pago Completo</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {salePaymentInfo ? formatCurrency(salePaymentInfo.remainingAmount) : '-'}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentType('PARTIAL')}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${paymentType === 'PARTIAL'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 dark:text-slate-300'
                            }`}
                        >
                          <Clock className={`w-5 h-5 mx-auto mb-1 ${paymentType === 'PARTIAL' ? 'text-yellow-500' : 'text-gray-400 dark:text-slate-500'}`} />
                          <p className="font-medium text-sm">Pago Parcial</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Especificar monto</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Partial Payment Amount - only show if there's remaining amount */}
                  {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && paymentType === 'PARTIAL' && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Monto del Abono
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={salePaymentInfo?.remainingAmount || 99999}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      {paymentAmount && salePaymentInfo && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-slate-300">Monto a abonar:</span>
                            <span className="font-medium text-yellow-700 dark:text-yellow-400">{formatCurrency(parseFloat(paymentAmount) || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600 dark:text-slate-300">Nuevo saldo pendiente:</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              {formatCurrency(Math.max(0, salePaymentInfo.remainingAmount - (parseFloat(paymentAmount) || 0)))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Method - only show if there's remaining amount */}
                  {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Método de Pago
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value="BANK_TRANSFER">🏦 Transferencia Bancaria</option>
                        <option value="CASH">💵 Efectivo</option>
                        <option value="CREDIT_CARD">💳 Tarjeta de Crédito</option>
                        <option value="DEBIT_CARD">💳 Tarjeta de Débito</option>
                        <option value="OTHER">📋 Otro</option>
                      </select>
                    </div>
                  )}

                  {/* Payment Notes (Optional) - only show if there's remaining amount */}
                  {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Notas <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Ej: Abono del 50% de la factura"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* File Input Area - only show if there's remaining amount */}
                  {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Comprobante de Pago
                      </label>
                      <div
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${receiptFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
                          }`}
                      >
                        <input
                          type="file"
                          ref={receiptInputRef}
                          onChange={handleReceiptSelect}
                          accept="image/*,.pdf"
                          className="hidden"
                        />

                        {receiptFile ? (
                          <div>
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                            </div>
                            <p className="font-medium text-gray-800 dark:text-white text-sm">{receiptFile.name}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <button
                              onClick={() => receiptInputRef.current?.click()}
                              className="mt-2 text-xs text-blue-600 hover:underline"
                            >
                              Cambiar archivo
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Upload className="w-5 h-5 text-gray-400 dark:text-slate-400" />
                            </div>
                            <p className="text-gray-800 dark:text-white font-medium text-sm">
                              Selecciona imagen o PDF
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              JPG, PNG, WEBP o PDF
                            </p>
                            <button
                              onClick={() => receiptInputRef.current?.click()}
                              className="mt-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Seleccionar archivo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {receiptUploadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{receiptUploadError}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark flex gap-3 justify-end bg-gray-50 dark:bg-slate-800/50">
                  <button
                    onClick={closeReceiptModal}
                    className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {salePaymentInfo && salePaymentInfo.remainingAmount <= 0 ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && (
                    <button
                      onClick={handleReceiptUpload}
                      disabled={!receiptFile || isUploadingReceipt || loadingSaleInfo || (paymentType === 'PARTIAL' && (!paymentAmount || parseFloat(paymentAmount) <= 0))}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUploadingReceipt ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Registrar Pago
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        }

        {/* Pending Sales Slide-over Panel */}
        {
          showPendingSalesPanel && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowPendingSalesPanel(false)} />
              <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-surface-dark shadow-xl flex flex-col transition-colors">
                {/* Header */}
                <div className="px-6 py-4 border-b border-orange-500 flex items-center justify-between bg-orange-500">
                  <div className="flex items-center gap-3">
                    <Camera className="w-6 h-6 text-white" />
                    <div>
                      <h2 className="text-lg font-bold text-white">Ventas sin Comprobante</h2>
                      <p className="text-sm text-white/90">{pendingSalesCount} ventas pendientes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPendingSalesPanel(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {pendingSalesCount === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-slate-300 font-medium">¡Excelente!</p>
                      <p className="text-gray-500 dark:text-slate-400">No tienes ventas pendientes de comprobante.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mySales
                        .filter(sale => (sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID')
                        .map((sale) => (
                          <div
                            key={sale.id}
                            className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 transition-colors shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-gray-800 dark:text-white">
                                    #{sale.orderNumber || sale.id}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${sale.status?.toUpperCase() === 'REJECTED'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                    }`}>
                                    {sale.status?.toUpperCase() === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-400">{sale.customerName || 'Sin cliente'}</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                                  {formatCurrency(sale.total || sale.totalAmount)}
                                </p>
                                {sale.status?.toUpperCase() === 'REJECTED' && sale.rejectionReason && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-xs text-red-700 dark:text-red-400">
                                      <strong>Motivo:</strong> {sale.rejectionReason}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setShowPendingSalesPanel(false);
                                  openReceiptModal(sale);
                                }}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                              >
                                <Upload className="w-4 h-4" />
                                Subir
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}

export default SellerHome;
