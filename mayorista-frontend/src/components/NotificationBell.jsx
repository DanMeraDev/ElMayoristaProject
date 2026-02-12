import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notification.api';
import { useAuth } from '../context/AuthContext';

function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Poll unread count every 60 seconds
    useEffect(() => {
        if (!user) return;

        const fetchCount = async () => {
            try {
                const count = await getUnreadCount();
                setUnreadCount(count);
            } catch (error) {
                // Silently fail - don't disrupt the UI
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleToggle = async () => {
        const willOpen = !isOpen;
        setIsOpen(willOpen);

        if (willOpen) {
            setLoading(true);
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error('Error loading notifications:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.read) {
                await markAsRead(notification.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }

        setIsOpen(false);

        // Navigate based on user role
        const roles = user?.roles || [];
        if (roles.includes('SELLER')) {
            navigate('/seller/ventas');
        } else if (roles.includes('ADMIN')) {
            navigate('/admin/sales-review');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getDaysAgo = (referenceDate) => {
        if (!referenceDate) return null;
        const now = new Date();
        const ref = new Date(referenceDate);
        const diffMs = now - ref;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'hoy';
        if (diffDays === 1) return 'hace 1 dia';
        return `hace ${diffDays} dias`;
    };

    const getTimeAgo = (createdAt) => {
        if (!createdAt) return '';
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins}m`;
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays === 1) return 'hace 1 dia';
        return `hace ${diffDays} dias`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="p-2 text-gray-400 hover:text-primary dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative"
                title="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-surface-dark">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-border-dark bg-gray-50/50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Notificaciones
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                                >
                                    Marcar todo como leido
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                                Cargando...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No tienes notificaciones
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-border-dark/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                                        !notification.read ? 'bg-primary/5 dark:bg-primary/10' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg ${
                                            !notification.read
                                                ? notification.type === 'SALE_PENDING_ADMIN_ALERT'
                                                    ? 'bg-red-100 dark:bg-red-900/30'
                                                    : 'bg-orange-100 dark:bg-orange-900/30'
                                                : 'bg-gray-100 dark:bg-slate-700'
                                        }`}>
                                            <AlertCircle className={`w-4 h-4 ${
                                                !notification.read
                                                    ? notification.type === 'SALE_PENDING_ADMIN_ALERT'
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-orange-600 dark:text-orange-400'
                                                    : 'text-gray-400 dark:text-slate-500'
                                            }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm font-medium truncate ${
                                                    !notification.read
                                                        ? 'text-slate-900 dark:text-white'
                                                        : 'text-slate-600 dark:text-slate-400'
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                                                )}
                                            </div>
                                            <p className={`text-xs mt-0.5 truncate ${
                                                !notification.read
                                                    ? 'text-slate-700 dark:text-slate-300'
                                                    : 'text-slate-500 dark:text-slate-500'
                                            }`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {notification.referenceDate && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {getDaysAgo(notification.referenceDate)}
                                                    </span>
                                                )}
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                                    {getTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-border-dark bg-gray-50/50 dark:bg-slate-800/50">
                            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                                {unreadCount > 0
                                    ? `${unreadCount} notificacion${unreadCount !== 1 ? 'es' : ''} sin leer`
                                    : 'Todas las notificaciones leidas'
                                }
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
