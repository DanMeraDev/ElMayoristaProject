import { Menu, Moon, Sun, Percent } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

/**
 * Shared top navbar for all seller pages.
 * Props:
 *   isSidebarOpen: boolean
 *   onSidebarOpen: () => void
 *   title: string
 *   children: extra right-side content (optional)
 */
function SellerTopbar({ isSidebarOpen, onSidebarOpen, title, children }) {
    const { user } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <header className="h-16 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-border-dark flex items-center justify-between px-4 sm:px-6 flex-shrink-0 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-2">
                {/* Mobile hamburger */}
                <button
                    onClick={onSidebarOpen}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 md:hidden"
                    title="Abrir menú"
                >
                    <Menu className="w-5 h-5" />
                </button>
                {/* Desktop toggle — only when sidebar is closed */}
                {!isSidebarOpen && (
                    <button
                        onClick={onSidebarOpen}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hidden md:block"
                        title="Mostrar menú"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
                <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{title}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Extra right-side content slot */}
                {children}

                {/* Commission badge — only if user has a commission percentage */}
                {user?.commissionPercentage != null && (
                    <div className="hidden sm:flex items-center bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">
                            Comisión: <span className="text-primary">{user.commissionPercentage}%</span>
                        </span>
                    </div>
                )}

                <NotificationBell />

                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                <button
                    onClick={toggleDarkMode}
                    className="p-2 text-gray-400 hover:text-primary dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {user?.profilePhotoUrl ? (
                    <img src={user.profilePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'V'}
                    </div>
                )}
            </div>
        </header>
    );
}

export default SellerTopbar;
