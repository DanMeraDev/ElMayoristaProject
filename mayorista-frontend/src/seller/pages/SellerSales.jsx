import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    FileText, ChevronRight, DollarSign, LogOut, ShoppingBag,
    Percent, X, Eye, Calendar, Search, Filter, TrendingUp, Package, Moon, Sun,
    PlusCircle, Hourglass, FileSearch, CheckCircle, XCircle, Info, Upload, ArrowRight,
    ExternalLink, ShieldCheck, Mail, Phone, Loader2, ImageIcon, Camera, Clock, AlertCircle, Trash2, Tv
} from 'lucide-react';
import { getMySales, getMyCommission, getMyProfile, getSaleDetails, registerPaymentWithReceipt, uploadReport, getCommissionStats, deleteSale, deletePayment } from '../../api/reports.api';
import SellerSidebar from '../components/SellerSidebar';
import SellerFooter from '../components/SellerFooter';
import SalesUploadModal from '../components/SalesUploadModal';
import TvSaleModal from '../components/TvSaleModal';
import PendingSalesPanel from '../components/PendingSalesPanel';
import NotificationBell from '../../components/NotificationBell';

function SellerSales() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [sales, setSales] = useState([]);
    const [salesLoading, setSalesLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const [selectedSale, setSelectedSale] = useState(null);
    const [monthlyCommission, setMonthlyCommission] = useState(0);
    const [commissionStats, setCommissionStats] = useState({
        earnedCommission: 0,
        pendingCommission: 0,
        paidCommission: 0,
        totalSales: 0,
        approvedSalesCount: 0,
        pendingSalesCount: 0,
        underReviewSalesCount: 0,
        rejectedSalesCount: 0
    });
    const [commissionPercentage, setCommissionPercentage] = useState(5);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const [saleForReceipt, setSaleForReceipt] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [receiptUploadError, setReceiptUploadError] = useState('');
    const receiptInputRef = useRef(null);

    // Payment state for partial payments
    const [paymentType, setPaymentType] = useState('FULL'); // 'FULL' or 'PARTIAL'
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [salePaymentInfo, setSalePaymentInfo] = useState(null);
    const [loadingSaleInfo, setLoadingSaleInfo] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showTvModal, setShowTvModal] = useState(false);
    const [showNewSaleMenu, setShowNewSaleMenu] = useState(false);
    const [showPendingSalesPanel, setShowPendingSalesPanel] = useState(false);
    const fileInputRef = useRef(null);
    const newSaleMenuRef = useRef(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [isDeletingSale, setIsDeletingSale] = useState(false);

    const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);

    const [saleDetails, setSaleDetails] = useState(null);
    const [loadingSaleDetails, setLoadingSaleDetails] = useState(false);

    useEffect(() => {
        const userId = user?.userId || user?.id;
        if (userId) {
            loadUserProfile();
            loadSales();
            loadCommission();
        }
    }, [currentPage, user?.id]);

    // Load sale details when a sale is selected
    useEffect(() => {
        if (selectedSale) {
            loadSaleDetails(selectedSale.id);
        } else {
            setSaleDetails(null);
        }
    }, [selectedSale]);

    const loadUserProfile = async () => {
        const userId = user?.userId || user?.id;
        if (!userId) return;

        try {
            const response = await getMyProfile(userId);
            const profile = response.data;
            const percentage = profile?.commissionPercentage ?? profile?.commission ?? profile?.commissionRate ?? 5;
            setCommissionPercentage(percentage);
        } catch (err) {
            console.error('Error loading user profile:', err);
        }
    };

    const loadSales = async () => {
        const userId = user?.userId || user?.id;
        if (!userId) return;

        setSalesLoading(true);
        try {
            const response = await getMySales(userId, currentPage, pageSize);
            const data = response.data;

            if (data.content) {
                setSales(data.content);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || data.content.length);
            } else if (Array.isArray(data)) {
                setSales(data);
                setTotalPages(1);
                setTotalElements(data.length);
            } else {
                setSales(data.sales || data.ventas || []);
                setTotalElements(data.sales?.length || 0);
            }
        } catch (err) {
            console.error('Error loading sales:', err);
        } finally {
            setSalesLoading(false);
        }
    };

    const loadCommission = async () => {
        const userId = user?.userId || user?.id;
        if (!userId) return;

        try {
            // Load stats first as it's more comprehensive
            const statsResponse = await getCommissionStats(userId);
            if (statsResponse.data) {
                setCommissionStats(statsResponse.data);
                // Only use earnedCommission (unsettled) for "Comisión Mes" - resets when admin closes cycle
                setMonthlyCommission(statsResponse.data.earnedCommission || 0);
            } else {
                // Fallback to simple commission if stats fails or is empty
                const response = await getMyCommission(userId);
                let commissionValue = 0;
                if (typeof response.data === 'number') {
                    commissionValue = response.data;
                } else if (response.data?.totalCommission !== undefined) {
                    commissionValue = response.data.totalCommission;
                } else if (response.data?.amount !== undefined) {
                    commissionValue = response.data.amount;
                }
                setMonthlyCommission(commissionValue);
            }
        } catch (err) {
            console.error('Error loading commission:', err);
        }
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

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
            case 'APROBADA':
                return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800';
            case 'PENDING':
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
            case 'EN_REVISION':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
            case 'REJECTED':
            case 'RECHAZADA':
                return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': case 'APROBADA': return <CheckCircle className="w-3.5 h-3.5" />;
            case 'PENDING': case 'PENDIENTE': return <Hourglass className="w-3.5 h-3.5" />;
            case 'UNDER_REVIEW': case 'IN_REVIEW': case 'EN_REVISION': return <FileSearch className="w-3.5 h-3.5" />;
            case 'REJECTED': case 'RECHAZADA': return <XCircle className="w-3.5 h-3.5" />;
            default: return <Info className="w-3.5 h-3.5" />;
        }
    };

    const getProgressInfo = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': case 'APROBADA': return { percent: 100, color: 'bg-emerald-500' };
            case 'PENDING': case 'PENDIENTE': return { percent: 25, color: 'bg-yellow-400' };
            case 'UNDER_REVIEW': case 'IN_REVIEW': case 'EN_REVISION': return { percent: 66, color: 'bg-purple-500' };
            case 'REJECTED': case 'RECHAZADA': return { percent: 100, color: 'bg-red-500 opacity-30' };
            default: return { percent: 0, color: 'bg-gray-300' };
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'Aprobada';
            case 'PENDING': return 'Pendiente';
            case 'UNDER_REVIEW': return 'En Revisión';
            case 'IN_REVIEW': return 'En Revisión';
            case 'REJECTED': return 'Rechazada';
            default: return status || 'Pendiente';
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method?.toUpperCase()) {
            case 'BANK_TRANSFER': return 'Transferencia Bancaria';
            case 'CASH': return 'Efectivo';
            case 'CREDIT_CARD': return 'Tarjeta de Crédito';
            case 'DEBIT_CARD': return 'Tarjeta de Débito';
            case 'CHECK': return 'Cheque';
            case 'PAYPAL': return 'PayPal';
            case 'OTHER': return 'Otro';
            default: return method || 'Transferencia Bancaria';
        }
    };

    const handleUploadSuccess = (uploadData) => {
        loadSales();
        loadCommission();
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
            loadSales();
            loadCommission();
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

    // Delete sale handlers
    const openDeleteModal = (sale) => {
        setSaleToDelete(sale);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setSaleToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDeleteSale = async () => {
        if (!saleToDelete) return;

        setIsDeletingSale(true);
        try {
            await deleteSale(saleToDelete.id);

            // Remove sale from local state
            setSales(prevSales => prevSales.filter(s => s.id !== saleToDelete.id));

            // Update totals
            setTotalElements(prev => prev - 1);

            // Reload commission stats
            loadCommission();

            closeDeleteModal();
        } catch (err) {
            console.error('Error deleting sale:', err);
            alert(err.response?.data?.message || 'Error al eliminar la venta. Verifica que el estado lo permita.');
        } finally {
            setIsDeletingSale(false);
        }
    };

    // Check if a sale can be deleted (only PENDING or REJECTED)
    const canDeleteSale = (sale) => {
        const status = sale.status?.toUpperCase();
        return status === 'PENDING' || status === 'REJECTED';
    };

    // Load full sale details with payments
    const loadSaleDetails = async (saleId) => {
        setLoadingSaleDetails(true);
        try {
            const response = await getSaleDetails(saleId);
            setSaleDetails(response.data);
        } catch (err) {
            console.error('Error loading sale details:', err);
            setSaleDetails(null);
        } finally {
            setLoadingSaleDetails(false);
        }
    };

    // Delete payment handlers
    const openDeletePaymentModal = (payment) => {
        setPaymentToDelete(payment);
        setShowDeletePaymentModal(true);
    };

    const closeDeletePaymentModal = () => {
        setPaymentToDelete(null);
        setShowDeletePaymentModal(false);
    };

    const handleDeletePayment = async () => {
        if (!paymentToDelete || !selectedSale) return;

        setIsDeletingPayment(true);
        try {
            await deletePayment(selectedSale.id, paymentToDelete.id);

            // Reload sale details to get updated payments
            await loadSaleDetails(selectedSale.id);

            // Reload sales list and commission
            loadSales();
            loadCommission();

            closeDeletePaymentModal();
        } catch (err) {
            console.error('Error deleting payment:', err);
            alert(err.response?.data?.message || 'Error al eliminar el comprobante. Verifica que el estado lo permita.');
        } finally {
            setIsDeletingPayment(false);
        }
    };


    // Filter sales based on all criteria
    const filteredSales = sales.filter(sale => {
        const matchesSearch = searchTerm === '' ||
            (sale.orderNumber?.toString().includes(searchTerm)) ||
            (sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sale.id?.toString().includes(searchTerm));

        const matchesStatus = statusFilter === 'ALL' ||
            sale.status?.toUpperCase() === statusFilter;

        // Date filter
        const saleDate = new Date(sale.orderDate || sale.date || sale.createdAt);
        const matchesStartDate = !startDate || saleDate >= new Date(startDate);
        const matchesEndDate = !endDate || saleDate <= new Date(endDate + 'T23:59:59');

        // Price filter
        const saleTotal = sale.total || sale.totalAmount || 0;
        const matchesMinPrice = !minPrice || saleTotal >= parseFloat(minPrice);
        const matchesMaxPrice = !maxPrice || saleTotal <= parseFloat(maxPrice);

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate && matchesMinPrice && matchesMaxPrice;
    });

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setStartDate('');
        setEndDate('');
        setMinPrice('');
        setMaxPrice('');
    };

    // Calculate totals
    // Calculate totals
    const totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total || sale.totalAmount || 0), 0);

    // Use counters from stats if available, otherwise fallback to current page (which is wrong but better than 0)
    // Actually, stats API should provide correct total counts. 
    // VendorCommissionStats usually provides monetary sums. 
    // We should rely on stats logic if possible, or totalElements from pagination if we filter.
    // The previous implementation filtered `sales` which is just ONE page. That is a bug.
    // We'll use totalElements for total. 
    // For status breakdown, we really need the stats API to provide counts, or make separate count calls.
    // Assuming getCommissionStats returns counts (if extended) or we just use what we have.
    // Since users complain about zero, likely they have 1 sale and filtering works.
    // But let's trust totalElements for total.

    const approvedSalesCount = commissionStats.approvedSalesCount || sales.filter(s => s.status?.toUpperCase() === 'APPROVED').length;
    const pendingSalesCount = commissionStats.pendingSalesCount || sales.filter(s => s.status?.toUpperCase() === 'PENDING').length;
    const reviewSalesCount = commissionStats.underReviewSalesCount || sales.filter(s => ['UNDER_REVIEW', 'IN_REVIEW', 'EN_REVISION'].includes(s.status?.toUpperCase())).length;

    const userCommission = commissionPercentage;

    return (
        <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-sans min-h-screen flex flex-col transition-colors duration-200">
            <style>{`
                /* Hide number input arrows */
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
                /* Custom date input styling */
                input[type="date"] {
                    position: relative;
                    cursor: pointer;
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }
                input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                }
                .progress-bar-striped {
                    background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
                    background-size: 1rem 1rem;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(209, 213, 219, 0.8);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 1);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.8);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(107, 114, 128, 1);
                }
            `}</style>

            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                {/* Sidebar */}
                <SellerSidebar
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    user={user}
                    onLogout={() => setShowLogoutModal(true)}
                />

                <main className={`flex-1 h-full flex flex-col overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                    <header className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-border-dark h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm transition-colors duration-200">
                        <div className="flex items-center gap-2">
                            {!isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="hidden md:flex mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400"
                                    title="Mostrar menú"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Mis Ventas</h1>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="hidden md:flex items-center bg-gray-50 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 transition-colors">
                                <Percent className="w-4 h-4 text-primary mr-2" />
                                <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
                                    Mi Comisión: <span className="text-gray-900 dark:text-white font-bold ml-1">{userCommission}%</span>
                                </span>
                            </div>

                            <div className="h-6 w-[1px] bg-gray-200 dark:bg-slate-700 hidden md:block"></div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleDarkMode}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                                <NotificationBell />
                            </div>
                        </div>
                    </header>

                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Seguimiento de Ventas</h1>
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">Gestiona el progreso de tus comprobantes en tiempo real con el tracker interactivo.</p>
                                </div>
                                <div className="relative" ref={newSaleMenuRef}>
                                    <button
                                        onClick={() => setShowNewSaleMenu(!showNewSaleMenu)}
                                        className="bg-mayorista-red hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <PlusCircle className="w-5 h-5" />
                                        Nueva Venta
                                        <ChevronRight className={`w-4 h-4 transition-transform ${showNewSaleMenu ? 'rotate-90' : ''}`} />
                                    </button>
                                    {showNewSaleMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowNewSaleMenu(false)} />
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                                <button
                                                    onClick={() => { setShowNewSaleMenu(false); setShowUploadModal(true); }}
                                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Comprobante PDF</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Subir comprobante de Odoo</p>
                                                    </div>
                                                </button>
                                                <div className="border-t border-gray-100 dark:border-gray-700" />
                                                <button
                                                    onClick={() => { setShowNewSaleMenu(false); setShowTvModal(true); }}
                                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Venta de Televisor</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Formulario manual de TV</p>
                                                    </div>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Ventas</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{totalElements}</p>
                                </div>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Package className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start justify-between border-l-4 border-l-yellow-400">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pendientes</p>
                                    <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{pendingSalesCount}</p>
                                </div>
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                                    <Hourglass className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start justify-between border-l-4 border-l-purple-500">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">En Revisión</p>
                                    <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{reviewSalesCount}</p>
                                </div>
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <FileSearch className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start justify-between border-l-4 border-l-emerald-500">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aprobadas</p>
                                    <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{approvedSalesCount}</p>
                                </div>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comisión Mes</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatCurrency(monthlyCommission)}</p>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-96">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
                                        <Search className="w-5 h-5" />
                                    </span>
                                    <input
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        placeholder="Buscar por ID, cliente o estado..."
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${showAdvancedFilters ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filtros Avanzados
                                    </button>
                                </div>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showAdvancedFilters && (
                                <div className="px-4 sm:px-5 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Date Range Filter */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Rango de Fechas
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">Desde</label>
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">Hasta</label>
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price Range Filter */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <DollarSign className="w-4 h-4" />
                                                Rango de Precios
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">Mínimo</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={minPrice}
                                                            onChange={(e) => setMinPrice(e.target.value)}
                                                            className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block font-medium">Máximo</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            placeholder="9999.99"
                                                            value={maxPrice}
                                                            onChange={(e) => setMaxPrice(e.target.value)}
                                                            className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Clear Filters Button */}
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={clearAllFilters}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Limpiar Filtros
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Status Filter Buttons */}
                            <div className="px-4 sm:px-5 pb-4 flex items-center gap-2 overflow-x-auto">
                                <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-primary text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Todos</button>
                                <button onClick={() => setStatusFilter('PENDING')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === 'PENDING' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <Hourglass className={`w-4 h-4 ${statusFilter === 'PENDING' ? 'text-white' : 'text-yellow-500'}`} /> Pendiente
                                </button>
                                <button onClick={() => setStatusFilter('UNDER_REVIEW')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === 'UNDER_REVIEW' ? 'bg-purple-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <FileSearch className={`w-4 h-4 ${statusFilter === 'UNDER_REVIEW' ? 'text-white' : 'text-purple-500'}`} /> En Revisión
                                </button>
                                <button onClick={() => setStatusFilter('APPROVED')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === 'APPROVED' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <CheckCircle className={`w-4 h-4 ${statusFilter === 'APPROVED' ? 'text-white' : 'text-green-500'}`} /> Aprobada
                                </button>
                                <button onClick={() => setStatusFilter('REJECTED')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === 'REJECTED' ? 'bg-red-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <XCircle className={`w-4 h-4 ${statusFilter === 'REJECTED' ? 'text-white' : 'text-red-500'}`} /> Rechazada
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm mt-6">
                            <div className="overflow-x-auto">
                                {salesLoading ? (
                                    <div className="text-center py-12">
                                        <Loader2 className="w-10 h-10 animate-spin text-mayorista-red mx-auto" />
                                        <p className="mt-4 text-gray-500 dark:text-gray-400">Cargando historial de ventas...</p>
                                    </div>
                                ) : filteredSales.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">No se encontraron ventas con los filtros seleccionados.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Venta & Cliente</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Fecha</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Monto & Comis.</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Tracker de Progreso</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-surface-dark">
                                            {filteredSales.map((sale) => {
                                                const progress = getProgressInfo(sale.status);
                                                return (
                                                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    {sale.saleType === 'TV' && (
                                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded">
                                                                            <Tv className="w-3 h-3" /> TV
                                                                        </span>
                                                                    )}
                                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">#{sale.orderNumber || sale.id}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{sale.customerName || 'Cliente General'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {formatDate(sale.orderDate || sale.date || sale.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total || sale.totalAmount)}</div>
                                                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                {sale.commissionAmount > 0 ? `+${formatCurrency(sale.commissionAmount)} com.` : 'Sin comisión'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col gap-2">
                                                                <span className={`px-2.5 py-0.5 w-fit text-[10px] uppercase tracking-wider font-bold rounded-full flex items-center gap-1.5 ${getStatusColor(sale.status)}`}>
                                                                    {getStatusIcon(sale.status)} {getStatusLabel(sale.status)}
                                                                </span>
                                                                <div className="w-40 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex shadow-inner">
                                                                    <div
                                                                        className={`h-full ${progress.color} transition-all duration-500 ${sale.status === 'UNDER_REVIEW' || sale.status === 'PENDING' ? 'progress-bar-striped' : ''}`}
                                                                        style={{ width: `${progress.percent}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {(sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID' && (
                                                                    <button
                                                                        onClick={(e) => openReceiptModal(sale, e)}
                                                                        className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
                                                                        title="Subir comprobante de pago"
                                                                    >
                                                                        <Upload className="w-4 h-4" />
                                                                        Subir Comprobante
                                                                    </button>
                                                                )}
                                                                {canDeleteSale(sale) && (
                                                                    <button
                                                                        onClick={() => openDeleteModal(sale)}
                                                                        className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                        title="Eliminar venta"
                                                                    >
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setSelectedSale(sale)}
                                                                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                    title="Ver detalles"
                                                                >
                                                                    <Eye className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="bg-white dark:bg-surface-dark px-4 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                                {!salesLoading && totalPages > 1 && (
                                    <>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Mostrando <span className="font-medium text-gray-900 dark:text-white">{currentPage * pageSize + 1}</span> a <span className="font-medium text-gray-900 dark:text-white">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> de <span className="font-medium text-gray-900 dark:text-white">{totalElements}</span> resultados
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                                        disabled={currentPage === 0}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>

                                                    {/* Simplified Pagination display */}
                                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {currentPage + 1} / {totalPages}
                                                    </span>

                                                    <button
                                                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                                        disabled={currentPage >= totalPages - 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <SellerFooter />
                </main>
            </div>

            {/* Modals from existing code */}
            {/* Logout Confirmation Modal */}
            {
                showLogoutModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Cerrar Sesión
                                </h3>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                ¿Estás seguro que deseas cerrar sesión?
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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

            {/* Sale Detail Modal */}
            {
                selectedSale && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-surface-dark px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {selectedSale.saleType === 'TV' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-md">
                                            <Tv className="w-3.5 h-3.5" /> TV
                                        </span>
                                    )}
                                    Detalle Venta #{selectedSale.orderNumber || selectedSale.id}
                                </h3>
                                <button
                                    onClick={() => setSelectedSale(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Sale Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{selectedSale.customerName || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                                        <p className="font-medium text-gray-800 dark:text-white">{formatDate(selectedSale.orderDate || selectedSale.date || selectedSale.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                                        <span className={`text-xs px-2 py-1 rounded-full border inline-block ${getStatusColor(selectedSale.status)}`}>
                                            {getStatusLabel(selectedSale.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Número de Orden</p>
                                        <p className="font-medium text-gray-800 dark:text-white">#{selectedSale.orderNumber || selectedSale.id}</p>
                                    </div>
                                </div>

                                {/* Rejection Reason */}
                                {selectedSale.status?.toUpperCase() === 'REJECTED' && selectedSale.rejectionReason && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Motivo del Rechazo:</p>
                                        <p className="text-sm text-red-600 dark:text-red-300">{selectedSale.rejectionReason}</p>
                                    </div>
                                )}

                                {/* TV Data */}
                                {selectedSale.saleType === 'TV' && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tv className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Datos del Televisor</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-purple-600 dark:text-purple-400">Numero de Serie</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSale.tvSerialNumber || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-purple-600 dark:text-purple-400">Modelo</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSale.tvModel || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Amounts */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                        <span className="text-gray-800 dark:text-white">{formatCurrency(selectedSale.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Envío</span>
                                        <span className="text-gray-800 dark:text-white">{formatCurrency(selectedSale.shippingCost || selectedSale.shipping || 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
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

                                {/* Payments/Receipts Section */}
                                {loadingSaleDetails ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        <span className="ml-2 text-gray-500 dark:text-gray-400">Cargando comprobantes...</span>
                                    </div>
                                ) : saleDetails?.payments && saleDetails.payments.length > 0 ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Comprobantes de Pago ({saleDetails.payments.length})
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {saleDetails.payments.map((payment, index) => (
                                                <div key={payment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                                    Comprobante #{index + 1}
                                                                </span>
                                                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                                                    {getPaymentMethodLabel(payment.paymentMethod)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {formatCurrency(payment.amount)}
                                                            </p>
                                                            {payment.notes && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {payment.notes}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                                {formatDate(payment.paymentDate || payment.createdAt)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => openDeletePaymentModal(payment)}
                                                            className="text-red-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title="Eliminar comprobante"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {payment.receiptUrl && (
                                                        <div className="mt-2">
                                                            <img
                                                                src={payment.receiptUrl}
                                                                alt={`Comprobante ${index + 1}`}
                                                                className="rounded-lg max-w-full h-auto border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(payment.receiptUrl, '_blank')}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-2">
                                        <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            No hay comprobantes de pago registrados para esta venta.
                                        </p>
                                    </div>
                                )}

                                {/* Report PDF */}
                                {selectedSale.reportPdfUrl && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Reporte PDF</p>
                                            <a
                                                href={selectedSale.reportPdfUrl}
                                                download={`Reporte-${selectedSale.orderNumber || selectedSale.id}.pdf`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline flex items-center gap-1"
                                            >
                                                <FileText className="w-3 h-3" />
                                                Descargar PDF
                                            </a>
                                        </div>
                                        <iframe
                                            src={selectedSale.reportPdfUrl}
                                            width="100%"
                                            height="300px"
                                            className="rounded-lg border border-gray-200 dark:border-gray-700"
                                            title={`Reporte de Venta ${selectedSale.orderNumber || selectedSale.id}`}
                                        >
                                            Cargando PDF...
                                        </iframe>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setSelectedSale(null)}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Receipt Upload Modal */}
            {
                saleForReceipt && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto transition-colors">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Registrar Pago y Comprobante
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Venta #{saleForReceipt.orderNumber || saleForReceipt.id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeReceiptModal}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-5">
                                {/* Rejection reason warning */}
                                {saleForReceipt.status?.toUpperCase() === 'REJECTED' && saleForReceipt.rejectionReason && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                                        <p className="text-sm font-medium">Motivo del rechazo anterior:</p>
                                        <p className="text-sm">{saleForReceipt.rejectionReason}</p>
                                    </div>
                                )}

                                {/* Payment Info Card */}
                                {loadingSaleInfo ? (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cargando información de pago...</p>
                                    </div>
                                ) : salePaymentInfo && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            Estado del Pago
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Venta</p>
                                                <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(salePaymentInfo.total)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Pagado</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-500">{formatCurrency(salePaymentInfo.totalPaid)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente</p>
                                                <p className="text-lg font-bold text-orange-600 dark:text-orange-500">{formatCurrency(salePaymentInfo.remainingAmount)}</p>
                                            </div>
                                        </div>
                                        {salePaymentInfo.paymentStatus === 'PAID' && salePaymentInfo.remainingAmount <= 0 && (
                                            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Pago completado - En revisión</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Esta venta ya ha sido pagada en su totalidad y está pendiente de revisión por el administrador.</p>
                                            </div>
                                        )}
                                        {salePaymentInfo.totalPaid > 0 && salePaymentInfo.paymentStatus !== 'PAID' && (
                                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                                <span className={`text-xs px-2 py-1 rounded-full ${salePaymentInfo.paymentStatus === 'PARTIALLY_PAID' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tipo de Pago
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentType('FULL')}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${paymentType === 'FULL'
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-300'
                                                    }`}
                                            >
                                                <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${paymentType === 'FULL' ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                                <p className="font-medium text-sm">Pago Completo</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {salePaymentInfo ? formatCurrency(salePaymentInfo.remainingAmount) : '-'}
                                                </p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentType('PARTIAL')}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${paymentType === 'PARTIAL'
                                                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-300'
                                                    }`}
                                            >
                                                <Clock className={`w-5 h-5 mx-auto mb-1 ${paymentType === 'PARTIAL' ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                                <p className="font-medium text-sm">Pago Parcial</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Especificar monto</p>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Partial Payment Amount - only show if there's remaining amount */}
                                {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && paymentType === 'PARTIAL' && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        {paymentAmount && salePaymentInfo && (
                                            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-300">Monto a abonar:</span>
                                                    <span className="font-medium text-yellow-700 dark:text-yellow-400">{formatCurrency(parseFloat(paymentAmount) || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-gray-600 dark:text-gray-300">Nuevo saldo pendiente:</span>
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Método de Pago
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Notas <span className="text-gray-400 font-normal">(opcional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            placeholder="Ej: Abono del 50% de la factura"
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                )}

                                {/* File Input Area - only show if there's remaining amount */}
                                {(!salePaymentInfo || salePaymentInfo.remainingAmount > 0) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Comprobante de Pago
                                        </label>
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${receiptFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <Upload className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-800 dark:text-white font-medium text-sm">
                                                        Selecciona imagen o PDF
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm">{receiptUploadError}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end bg-gray-50 dark:bg-gray-800/50">
                                <button
                                    onClick={closeReceiptModal}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
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

            {/* PDF Upload Modal */}
            <SalesUploadModal
                isOpen={showUploadModal}
                onClose={() => {
                    setShowUploadModal(false);
                    loadSales();
                    loadCommission();
                }}
                onUploadSuccess={handleUploadSuccess}
            />

            {/* TV Sale Modal */}
            <TvSaleModal
                isOpen={showTvModal}
                onClose={() => {
                    setShowTvModal(false);
                    loadSales();
                    loadCommission();
                }}
                onSuccess={() => {
                    loadSales();
                    loadCommission();
                }}
            />

            {/* Pending Sales Panel */}
            <PendingSalesPanel
                isOpen={showPendingSalesPanel}
                onClose={() => setShowPendingSalesPanel(false)}
                pendingSales={sales.filter(sale => (sale.status?.toUpperCase() === 'PENDING' || sale.status?.toUpperCase() === 'REJECTED') && sale.paymentStatus !== 'PAID')}
                onUploadReceipt={openReceiptModal}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && saleToDelete && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75"
                            onClick={closeDeleteModal}
                        ></div>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            {/* Header */}
                            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                                            Confirmar Eliminación
                                        </h3>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            Esta acción no se puede deshacer
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                    ¿Estás seguro de que deseas eliminar esta venta?
                                </p>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Venta:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            #{saleToDelete.orderNumber || saleToDelete.id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {saleToDelete.customerName || 'Cliente General'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(saleToDelete.total || saleToDelete.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(saleToDelete.status)}`}>
                                            {getStatusLabel(saleToDelete.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                                    <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        Al eliminar esta venta, se eliminarán también todos los comprobantes de pago asociados.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={closeDeleteModal}
                                    disabled={isDeletingSale}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteSale}
                                    disabled={isDeletingSale}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeletingSale ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Venta
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Payment Confirmation Modal */}
            {showDeletePaymentModal && paymentToDelete && (
                <div className="fixed inset-0 z-[70] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75"
                            onClick={closeDeletePaymentModal}
                        ></div>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            {/* Header */}
                            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                                            Eliminar Comprobante
                                        </h3>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            Esta acción no se puede deshacer
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-gray-700 dark:text-gray-300">
                                    ¿Estás seguro de que deseas eliminar este comprobante de pago?
                                </p>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {formatCurrency(paymentToDelete.amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Método:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {getPaymentMethodLabel(paymentToDelete.paymentMethod)}
                                        </span>
                                    </div>
                                    {paymentToDelete.notes && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Notas:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {paymentToDelete.notes}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {formatDate(paymentToDelete.paymentDate || paymentToDelete.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                                    <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        Al eliminar este comprobante, se recalculará el estado de pago de la venta.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={closeDeletePaymentModal}
                                    disabled={isDeletingPayment}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeletePayment}
                                    disabled={isDeletingPayment}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeletingPayment ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Eliminando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar Comprobante
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

export default SellerSales;
