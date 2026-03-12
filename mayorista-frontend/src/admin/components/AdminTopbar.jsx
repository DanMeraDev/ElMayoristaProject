import { Menu, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

/**
 * Shared top navbar for all admin pages.
 * Props:
 *   isSidebarOpen: boolean
 *   onSidebarOpen: () => void
 *   title: string
 *   icon: JSX element (optional)
 *   children: extra right-side content (optional, e.g. a refresh button)
 */
function AdminTopbar({ isSidebarOpen, onSidebarOpen, title, icon, children }) {
    const { user } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    return (
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
            <div className="flex items-center gap-2">
                {/* Mobile hamburger — always visible on mobile */}
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
                {icon && <span className="text-primary">{icon}</span>}
                <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{title}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Extra right-side content slot (e.g. refresh button) */}
                {children}

                <NotificationBell />

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                <button
                    onClick={toggleDarkMode}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {user?.profilePhotoUrl ? (
                    <img src={user.profilePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                )}
            </div>
        </header>
    );
}

export default AdminTopbar;
