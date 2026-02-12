import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    CheckCircle,
    Settings,
    LogOut,
    ChevronLeft,
    RefreshCw,
    ShoppingBag,
    History,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function AdminSidebar({ isOpen, onClose, pendingRequestsCount = 0 }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const handleLinkClick = () => {
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    bg-sidebar-dark text-slate-300 border-r border-slate-600 flex flex-col h-screen transition-all duration-300 ease-in-out
                    fixed md:sticky top-0 z-50
                    ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden'}
                `}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border dark:border-slate-700">
                    <img
                        src="/logo.png"
                        alt="El Mayorista"
                        className="h-8 object-contain"
                    />
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5 md:hidden" />
                        <ChevronLeft className="w-5 h-5 hidden md:block" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    <Link
                        to="/admin/dashboard"
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/dashboard')
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <LayoutDashboard className={`w-5 h-5 transition-colors ${isActive('/admin/dashboard') ? 'text-primary' : 'group-hover:text-primary'}`} />
                        <span className="text-sm font-medium">Panel Principal</span>
                    </Link>

                    <Link
                        to="/admin/sellers"
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/sellers')
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <Users className={`w-5 h-5 transition-colors ${isActive('/admin/sellers') ? 'text-primary' : 'group-hover:text-primary'}`} />
                        <span className="text-sm font-medium">Gestión de Vendedores</span>
                    </Link>

                    <Link
                        to="/admin/sales-history"
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/sales-history')
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <History className={`w-5 h-5 transition-colors ${isActive('/admin/sales-history') ? 'text-primary' : 'group-hover:text-primary'}`} />
                        <span className="text-sm font-medium">Historial de Ventas</span>
                    </Link>

                    <Link
                        to="/admin/reports"
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/reports')
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <BarChart3 className={`w-5 h-5 transition-colors ${isActive('/admin/reports') ? 'text-primary' : 'group-hover:text-primary'}`} />
                        <span className="text-sm font-medium">Reportes</span>
                    </Link>

                    <Link
                        to="/admin/sales-review"
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/sales-review')
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <CheckCircle className={`w-5 h-5 transition-colors ${isActive('/admin/sales-review') ? 'text-primary' : 'group-hover:text-primary'}`} />
                        <span className="text-sm font-medium">Revisar Ventas</span>
                        {pendingRequestsCount > 0 && (
                            <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </Link>

                    <div className="pt-4 mt-4 border-t border-slate-600">
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Administración</p>
                        <Link
                            to="/admin/settings"
                            onClick={handleLinkClick}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/settings')
                                ? 'text-slate-100 bg-sidebar-hover'
                                : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                                }`}
                        >
                            <Settings className={`w-5 h-5 transition-colors ${isActive('/admin/settings') ? 'text-primary' : 'group-hover:text-primary'}`} />
                            <span className="text-sm font-medium">Configuración</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-600">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Admin'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Cerrar sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;

