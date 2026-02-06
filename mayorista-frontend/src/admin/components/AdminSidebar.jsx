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
    History
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

    return (
        <aside className={`bg-sidebar-dark text-slate-300 border-r border-slate-600 flex-col hidden md:flex sticky top-0 h-screen transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border dark:border-slate-700">
                <img
                    src="https://megamayorista.net/wp-content/uploads/2025/09/cropped-cropped-LOGO-LARGO.webp"
                    alt="El Mayorista"
                    className="h-8 object-contain"
                />
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1">
                <Link
                    to="/admin/dashboard"
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
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-sidebar-hover rounded-lg transition-all group">
                        <Settings className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium">Configuración</span>
                    </a>
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
    );
}

export default AdminSidebar;
