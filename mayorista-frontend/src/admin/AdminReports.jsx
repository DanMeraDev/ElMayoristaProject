import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Bell,
    Moon,
    Sun,
    FileSpreadsheet,
    Download,
    Calendar,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Loader2,
    RefreshCw,
    BarChart3,
    Clock,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { getCycles, getCurrentCycleStats, closeCycle, getSalesUnderReview } from '../api/admin.api';
import AdminFooter from './components/AdminFooter';
import AdminSidebar from './components/AdminSidebar';

function AdminReports() {
    const { user } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Data state
    const [cycles, setCycles] = useState([]);
    const [currentCycle, setCurrentCycle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const [error, setError] = useState('');

    // Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Notification state
    const [notification, setNotification] = useState(null);

    // Stats for sidebar
    const [stats, setStats] = useState({ pendingRequests: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [cyclesRes, currentRes, pendingRes] = await Promise.all([
                getCycles(),
                getCurrentCycleStats(),
                getSalesUnderReview(0, 1)
            ]);

            setCycles(cyclesRes.data || []);
            setCurrentCycle(currentRes.data);
            setStats({ pendingRequests: pendingRes.data?.totalElements || 0 });
        } catch (err) {
            console.error('Error loading reports data:', err);
            setError('Error al cargar los datos de reportes.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseCycle = async () => {
        setIsClosing(true);
        try {
            const response = await closeCycle();

            // Create blob and download
            const blob = new Blob([response], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Cierre_Ciclo_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showNotification('success', 'Ciclo cerrado exitosamente. El reporte se ha descargado.');
            setShowConfirmModal(false);
            await loadData(); // Refresh data
        } catch (err) {
            console.error('Error closing cycle:', err);
            const errorMsg = err.response?.data
                ? (typeof err.response.data === 'string' ? err.response.data : 'Error al cerrar el ciclo.')
                : 'Error al cerrar el ciclo. Por favor intenta nuevamente.';
            showNotification('error', errorMsg);
        } finally {
            setIsClosing(false);
        }
    };

    const handleDownloadReport = (url) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            showNotification('error', 'El archivo de reporte no está disponible.');
        }
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `$${(amount || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span className="font-medium text-slate-900 dark:text-white">Reportes</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={loadData}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
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
                        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            {notification.message}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                            <button onClick={loadData} className="mt-4 text-primary hover:underline">
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Current Cycle Card */}
                            <div className="bg-gradient-to-br from-primary/10 via-red-50 to-orange-50 dark:from-primary/20 dark:via-slate-800 dark:to-slate-800 border border-primary/20 dark:border-primary/30 rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                                <Clock className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ciclo Actual</h2>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {currentCycle?.startDate ? `Desde ${formatDate(currentCycle.startDate)}` : 'Sin ventas pendientes'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="bg-white/60 dark:bg-slate-700/50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                                                    <FileSpreadsheet className="w-4 h-4" />
                                                    Ventas
                                                </div>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {currentCycle?.salesCount || 0}
                                                </p>
                                            </div>
                                            <div className="bg-white/60 dark:bg-slate-700/50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                                                    <DollarSign className="w-4 h-4" />
                                                    Total Ventas
                                                </div>
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(currentCycle?.totalSales)}
                                                </p>
                                            </div>
                                            <div className="bg-white/60 dark:bg-slate-700/50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                                                    <TrendingUp className="w-4 h-4" />
                                                    Comisiones
                                                </div>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatCurrency(currentCycle?.totalCommissions)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:border-l lg:border-primary/20 lg:pl-6">
                                        <button
                                            onClick={() => setShowConfirmModal(true)}
                                            disabled={!currentCycle?.salesCount || currentCycle.salesCount === 0}
                                            className="w-full lg:w-auto px-6 py-3 bg-primary hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <FileSpreadsheet className="w-5 h-5" />
                                            Cerrar Ciclo
                                        </button>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center lg:text-left">
                                            {currentCycle?.salesCount > 0
                                                ? 'Descarga el reporte Excel y cierra el ciclo.'
                                                : 'No hay ventas para cerrar.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cycles History Table */}
                            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-border-light dark:border-border-dark">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historial de Ciclos</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {cycles.length} ciclos cerrados
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    {cycles.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400">No hay ciclos cerrados aún.</p>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                                Cuando cierres tu primer ciclo, aparecerá aquí.
                                            </p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período</th>
                                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ventas</th>
                                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Ventas</th>
                                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comisiones</th>
                                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Cierre</th>
                                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Reporte</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                                {cycles.map((cycle) => (
                                                    <tr key={cycle.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                                <div>
                                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                                        {formatDate(cycle.startDate)}
                                                                    </span>
                                                                    <span className="text-slate-400 mx-2">→</span>
                                                                    <span className="text-slate-600 dark:text-slate-300">
                                                                        {formatDate(cycle.endDate)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                                                {cycle.salesCount}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 font-medium text-green-600 dark:text-green-400">
                                                            {formatCurrency(cycle.totalSales)}
                                                        </td>
                                                        <td className="py-4 px-6 font-medium text-blue-600 dark:text-blue-400">
                                                            {formatCurrency(cycle.totalCommissions)}
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm">
                                                            {formatFullDate(cycle.endDate)}
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <button
                                                                onClick={() => handleDownloadReport(cycle.excelReportUrl)}
                                                                disabled={!cycle.excelReportUrl}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white text-xs font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                Excel
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <AdminFooter />
            </main>

            {/* Confirm Close Cycle Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50" onClick={() => !isClosing && setShowConfirmModal(false)}></div>
                        <div className="relative bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-md w-full p-6">
                            <button
                                onClick={() => !isClosing && setShowConfirmModal(false)}
                                disabled={isClosing}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    Cerrar Ciclo de Ventas
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Se procesarán <span className="font-semibold text-primary">{currentCycle?.salesCount} ventas</span> por un total de <span className="font-semibold text-green-600">{formatCurrency(currentCycle?.totalSales)}</span>.
                                </p>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Nota:</strong> Esta acción marcará todas las ventas como liquidadas. Se generará y descargará un reporte Excel con el resumen.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={isClosing}
                                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCloseCycle}
                                    disabled={isClosing}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isClosing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="w-4 h-4" />
                                            Confirmar Cierre
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReports;
