import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight,
    CheckCheck, RefreshCw
} from 'lucide-react';
import SellerSidebar from '../components/SellerSidebar';
import SellerTopbar from '../components/SellerTopbar';
import { useAuth } from '../../context/AuthContext';
import { getNotificationHistory, markAsRead, markAllAsRead } from '../../api/notification.api';

const TYPE_LABELS = {
    SALE_PENDING_REMINDER: 'Pago pendiente',
    SALE_UNDER_REVIEW: 'En revisión',
    SALE_APPROVED: 'Venta aprobada',
    SALE_REJECTED: 'Venta rechazada',
    SALE_RETURNED: 'Venta devuelta',
    RANKING_ACHIEVEMENT: 'Logro ranking',
    FIADO_APPROVED: 'Fiado aprobado',
    FIADO_REJECTED: 'Fiado rechazado',
    CUSTOMER_APPROVED: 'Cliente aprobado',
};

const TYPE_COLORS = {
    SALE_REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    SALE_RETURNED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    FIADO_REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    SALE_UNDER_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    SALE_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    FIADO_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CUSTOMER_APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    RANKING_ACHIEVEMENT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const getTypeColor = (type) =>
    TYPE_COLORS[type] || 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';

const getIconColor = (type, read) => {
    if (read) return 'text-gray-400 dark:text-slate-500';
    if (type === 'SALE_REJECTED' || type === 'SALE_RETURNED' || type === 'FIADO_REJECTED') return 'text-red-600 dark:text-red-400';
    if (type === 'SALE_UNDER_REVIEW') return 'text-purple-600 dark:text-purple-400';
    if (type === 'SALE_APPROVED' || type === 'FIADO_APPROVED' || type === 'CUSTOMER_APPROVED') return 'text-green-600 dark:text-green-400';
    if (type === 'RANKING_ACHIEVEMENT') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
};

const getIconBg = (type, read) => {
    if (read) return 'bg-gray-100 dark:bg-slate-700';
    if (type === 'SALE_REJECTED' || type === 'SALE_RETURNED' || type === 'FIADO_REJECTED') return 'bg-red-100 dark:bg-red-900/30';
    if (type === 'SALE_UNDER_REVIEW') return 'bg-purple-100 dark:bg-purple-900/30';
    if (type === 'SALE_APPROVED' || type === 'FIADO_APPROVED' || type === 'CUSTOMER_APPROVED') return 'bg-green-100 dark:bg-green-900/30';
    if (type === 'RANKING_ACHIEVEMENT') return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-orange-100 dark:bg-orange-900/30';
};

function getTimeAgo(createdAt) {
    if (!createdAt) return '';
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'hace 1 dia';
    return `hace ${diffDays} dias`;
}

function SellerNotificationsHistory() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filterRead, setFilterRead] = useState('all');

    const PAGE_SIZE = 20;

    const loadHistory = useCallback(async (p = 0, filter = filterRead) => {
        setLoading(true);
        try {
            const res = await getNotificationHistory(p, PAGE_SIZE, filter === 'all' ? null : filter);
            const data = res.data;
            setNotifications(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
            setPage(p);
        } catch (err) {
            console.error('Error loading notification history:', err);
        } finally {
            setLoading(false);
        }
    }, [filterRead]);

    useEffect(() => {
        loadHistory(0, filterRead);
    }, [filterRead]);

    const handleMarkAsRead = async (notification) => {
        if (notification.read) return;
        try {
            await markAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleNotificationClick = async (notification) => {
        await handleMarkAsRead(notification);
        const type = notification.type;
        if (type === 'CUSTOMER_APPROVED') navigate('/seller/fiar-usuarios');
        else if (type === 'FIADO_APPROVED' || type === 'FIADO_REJECTED') navigate('/seller/mis-fiados');
        else if (type === 'RANKING_ACHIEVEMENT') navigate('/seller/ranking');
        else navigate('/seller/ventas');
    };

    const filteredNotifications = notifications;
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-background-dark overflow-hidden">
            <SellerSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                user={user}
                onLogout={handleLogout}
            />

            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                {/* Top bar */}
                <SellerTopbar
                    isSidebarOpen={sidebarOpen}
                    onSidebarOpen={() => setSidebarOpen(true)}
                    title="Historial de Notificaciones"
                />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="max-w-3xl mx-auto">
                        {/* Actions bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg p-1">
                                {[
                                    { value: 'all', label: 'Todas' },
                                    { value: 'unread', label: 'No leidas' },
                                    { value: 'read', label: 'Leidas' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFilterRead(opt.value)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                            filterRead === opt.value
                                                ? 'bg-primary text-white'
                                                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadHistory(page)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Actualizar
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:text-primary-hover border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Marcar todo como leido
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications list */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden">
                            {loading ? (
                                <div className="py-16 text-center text-sm text-gray-500 dark:text-slate-400">
                                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
                                    Cargando notificaciones...
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="py-16 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                        {filterRead === 'unread' ? 'Sin notificaciones no leidas' : 'Sin notificaciones'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                        {filterRead !== 'all' ? 'Prueba cambiando el filtro.' : 'Aqui apareceran tus notificaciones.'}
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-border-dark/50">
                                    {filteredNotifications.map((n) => (
                                        <li key={n.id}>
                                            <button
                                                onClick={() => handleNotificationClick(n)}
                                                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                                                    !n.read ? 'bg-primary/5 dark:bg-primary/10' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${getIconBg(n.type, n.read)}`}>
                                                        <AlertCircle className={`w-4 h-4 ${getIconColor(n.type, n.read)}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                                            <p className={`text-sm font-medium ${
                                                                !n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-400'
                                                            }`}>
                                                                {n.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTypeColor(n.type)}`}>
                                                                    {TYPE_LABELS[n.type] || n.type}
                                                                </span>
                                                                {!n.read && (
                                                                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className={`text-xs mt-0.5 ${
                                                            !n.read ? 'text-gray-700 dark:text-slate-300' : 'text-gray-500 dark:text-slate-500'
                                                        }`}>
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            {n.referenceDate && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                                                                    <Clock className="w-3 h-3" />
                                                                    {n.referenceDate}
                                                                </span>
                                                            )}
                                                            <span className="text-[11px] text-gray-400 dark:text-slate-500">
                                                                {getTimeAgo(n.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-5">
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Pagina {page + 1} de {totalPages} &middot; {totalElements} notificaciones
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => loadHistory(page - 1)}
                                        disabled={page === 0}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-border-dark rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => loadHistory(page + 1)}
                                        disabled={page >= totalPages - 1}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-border-dark rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default SellerNotificationsHistory;
