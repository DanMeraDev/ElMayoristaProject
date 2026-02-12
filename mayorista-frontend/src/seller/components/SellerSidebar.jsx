import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, FileText, Info, LogOut, ChevronLeft, CreditCard, Users } from 'lucide-react';

function SellerSidebar({ isOpen, setIsOpen, user, onLogout }) {
    const location = useLocation();

    return (
        <aside className={`flex flex-col bg-sidebar-dark text-slate-300 border-r border-slate-600 h-full fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-600">
                <img
                    src="/logo.png"
                    alt="El Mayorista"
                    className="h-8 object-contain"
                />
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                <Link
                    to="/seller/home"
                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${location.pathname === '/seller/home'
                        ? 'text-slate-100 bg-sidebar-hover'
                        : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                        }`}
                >
                    <Home className={`w-5 h-5 transition-colors ${location.pathname === '/seller/home' ? 'text-primary' : 'group-hover:text-primary'
                        }`} />
                    <span className="text-sm font-medium">Inicio</span>
                </Link>

                <Link
                    to="/seller/ventas"
                    onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${location.pathname === '/seller/ventas'
                        ? 'text-slate-100 bg-sidebar-hover'
                        : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                        }`}
                >
                    <ShoppingBag className={`w-5 h-5 transition-colors ${location.pathname === '/seller/ventas' ? 'text-primary' : 'group-hover:text-primary'
                        }`} />
                    <span className="text-sm font-medium">Mis Ventas</span>
                </Link>

                {/* Mis Fiados - Solo visible si tiene permiso canCreditSelf */}
                {user?.canCreditSelf && (
                    <Link
                        to="/seller/mis-fiados"
                        onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${location.pathname === '/seller/mis-fiados'
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <CreditCard className={`w-5 h-5 transition-colors ${location.pathname === '/seller/mis-fiados' ? 'text-primary' : 'group-hover:text-primary'
                            }`} />
                        <span className="text-sm font-medium">Mis Fiados</span>
                    </Link>
                )}

                {/* Fiar a Usuarios - Solo visible si tiene permiso canCreditCustomers */}
                {user?.canCreditCustomers && (
                    <Link
                        to="/seller/fiar-usuarios"
                        onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${location.pathname === '/seller/fiar-usuarios'
                            ? 'text-slate-100 bg-sidebar-hover'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                            }`}
                    >
                        <Users className={`w-5 h-5 transition-colors ${location.pathname === '/seller/fiar-usuarios' ? 'text-primary' : 'group-hover:text-primary'
                            }`} />
                        <span className="text-sm font-medium">Fiar a Usuarios</span>
                    </Link>
                )}

                <div className="pt-4 mt-4 border-t border-slate-600">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ayuda</p>
                    <Link to="/seller/soporte" onClick={() => window.innerWidth < 768 && setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${location.pathname === '/seller/soporte'
                        ? 'text-slate-100 bg-sidebar-hover'
                        : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                        }`}>
                        <Info className={`w-5 h-5 transition-colors ${location.pathname === '/seller/soporte' ? 'text-primary' : 'group-hover:text-primary'}`} />
                        <span className="text-sm font-medium">Soporte</span>
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-600">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'V'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Vendedor'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default SellerSidebar;
