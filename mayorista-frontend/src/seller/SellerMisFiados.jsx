import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { CreditCard, Plus, CheckCircle, Clock, Moon, Sun, ChevronLeft, ChevronRight, DollarSign, Package } from 'lucide-react';
import SellerSidebar from './components/SellerSidebar';
import SellerFooter from './components/SellerFooter';
import { createFiado, getMyFiados } from '../api/fiado.api';
import NotificationBell from '../components/NotificationBell';

function SellerMisFiados() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [fiados, setFiados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ itemName: '', price: '' });
    const [showSuccess, setShowSuccess] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        loadFiados();
    }, []);

    const loadFiados = async () => {
        setLoading(true);
        try {
            const data = await getMyFiados();
            setFiados(data);
        } catch (error) {
            console.error('Error loading fiados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.itemName.trim() || !formData.price) return;

        setSubmitting(true);
        try {
            await createFiado({
                itemName: formData.itemName.trim(),
                price: parseFloat(formData.price)
            });
            setFormData({ itemName: '', price: '' });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            loadFiados();
        } catch (error) {
            console.error('Error creating fiado:', error);
            alert('Error al registrar el fiado. Por favor intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const pendingFiados = fiados.filter(f => f.status === 'PENDING');
    const totalPending = pendingFiados.reduce((sum, f) => sum + f.price, 0);

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 min-h-screen transition-colors duration-200">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <SellerSidebar
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    user={user}
                    onLogout={() => setShowLogoutModal(true)}
                />

                {/* Main Content Area */}
                <main className={`flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                    {/* Top Header */}
                    <header className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-border-dark h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm transition-colors duration-200">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`flex mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400 ${isSidebarOpen ? 'md:hidden' : ''}`}
                                title={isSidebarOpen ? "Cerrar menu" : "Mostrar menu"}
                            >
                                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Mis Fiados</h1>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
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
                    <div className="p-8 max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="w-8 h-8" />
                                Mis Fiados
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Registra articulos fiados que se descontaran de tus comisiones
                            </p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-gray-100 dark:border-border-dark">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendiente</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            ${totalPending.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-gray-100 dark:border-border-dark">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Fiados Pendientes</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {pendingFiados.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showSuccess && (
                            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                                <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Fiado registrado exitosamente
                                </p>
                            </div>
                        )}

                        {/* New Fiado Form */}
                        <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6 mb-8 border border-gray-100 dark:border-border-dark">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Registrar Fiado
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nombre del Articulo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.itemName}
                                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                        placeholder="Ej: Parlante JBL"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                                 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                        required
                                        maxLength="200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Precio ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                                 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6
                                             rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    {submitting ? 'Registrando...' : 'Registrar Fiado'}
                                </button>
                            </form>
                        </div>

                        {/* Fiados History */}
                        <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-gray-100 dark:border-border-dark">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                Historial de Fiados
                            </h2>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    Cargando fiados...
                                </div>
                            ) : fiados.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No tienes fiados registrados</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Articulo</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Precio</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fiados.map((fiado) => (
                                                <tr
                                                    key={fiado.id}
                                                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                                                        {fiado.itemName}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                                                        ${fiado.price.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {fiado.status === 'PENDING' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                                <Clock className="w-3 h-3" />
                                                                Pendiente
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Descontado
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                                                        {new Date(fiado.createdAt).toLocaleDateString('es-EC')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <SellerFooter />
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Cerrar Sesion
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            ¿Estas seguro que deseas cerrar sesion?
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                }}
                                className="px-4 py-2 bg-mayorista-red hover:bg-opacity-90 text-white font-medium rounded-md transition-colors"
                            >
                                Cerrar Sesion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SellerMisFiados;
