import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import {
    Moon, Sun, ChevronRight, Users, UserPlus, CreditCard, Plus,
    CheckCircle, Clock, XCircle, DollarSign, Package
} from 'lucide-react';
import SellerSidebar from '../components/SellerSidebar';
import SellerFooter from '../components/SellerFooter';
import { registerCustomer, getApprovedCustomers, createCustomerFiado, getMyCustomerFiados } from '../../api/customer.api';
import NotificationBell from '../../components/NotificationBell';

function SellerFiarUsuarios() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('fiar');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Register customer state
    const [customerForm, setCustomerForm] = useState({ fullName: '', idNumber: '', phoneNumber: '' });
    const [submittingCustomer, setSubmittingCustomer] = useState(false);
    const [customerSuccess, setCustomerSuccess] = useState('');
    const [customerError, setCustomerError] = useState('');

    // Approved customers for select
    const [approvedCustomers, setApprovedCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);

    // Fiado form state
    const [fiadoForm, setFiadoForm] = useState({ customerId: '', itemName: '', price: '' });
    const [submittingFiado, setSubmittingFiado] = useState(false);
    const [fiadoSuccess, setFiadoSuccess] = useState('');
    const [fiadoError, setFiadoError] = useState('');

    // Customer fiados list
    const [customerFiados, setCustomerFiados] = useState([]);
    const [loadingFiados, setLoadingFiados] = useState(true);

    useEffect(() => {
        loadApprovedCustomers();
        loadCustomerFiados();
    }, []);

    const loadApprovedCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const data = await getApprovedCustomers();
            setApprovedCustomers(data);
        } catch (error) {
            console.error('Error loading approved customers:', error);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const loadCustomerFiados = async () => {
        setLoadingFiados(true);
        try {
            const data = await getMyCustomerFiados();
            setCustomerFiados(data);
        } catch (error) {
            console.error('Error loading customer fiados:', error);
        } finally {
            setLoadingFiados(false);
        }
    };

    const handleRegisterCustomer = async (e) => {
        e.preventDefault();
        if (!customerForm.fullName.trim()) return;

        setSubmittingCustomer(true);
        setCustomerError('');
        try {
            await registerCustomer({
                fullName: customerForm.fullName.trim(),
                idNumber: customerForm.idNumber.trim() || null,
                phoneNumber: customerForm.phoneNumber.trim() || null
            });
            setCustomerForm({ fullName: '', idNumber: '', phoneNumber: '' });
            setCustomerSuccess('Cliente registrado exitosamente. Pendiente de aprobacion del administrador.');
            setTimeout(() => setCustomerSuccess(''), 5000);
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data || 'Error al registrar el cliente.';
            setCustomerError(typeof msg === 'string' ? msg : 'Error al registrar el cliente.');
            setTimeout(() => setCustomerError(''), 5000);
        } finally {
            setSubmittingCustomer(false);
        }
    };

    const handleCreateFiado = async (e) => {
        e.preventDefault();
        if (!fiadoForm.customerId || !fiadoForm.itemName.trim() || !fiadoForm.price) return;

        setSubmittingFiado(true);
        setFiadoError('');
        try {
            await createCustomerFiado({
                customerId: parseInt(fiadoForm.customerId),
                itemName: fiadoForm.itemName.trim(),
                price: parseFloat(fiadoForm.price)
            });
            setFiadoForm({ customerId: '', itemName: '', price: '' });
            setFiadoSuccess('Fiado registrado exitosamente.');
            setTimeout(() => setFiadoSuccess(''), 3000);
            loadCustomerFiados();
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data || 'Error al registrar el fiado.';
            setFiadoError(typeof msg === 'string' ? msg : 'Error al registrar el fiado.');
            setTimeout(() => setFiadoError(''), 5000);
        } finally {
            setSubmittingFiado(false);
        }
    };

    const pendingFiados = customerFiados.filter(f => f.status === 'PENDING');
    const totalPending = pendingFiados.reduce((sum, f) => sum + f.price, 0);

    const tabs = [
        { id: 'fiar', label: 'Fiar a Cliente', icon: CreditCard },
        { id: 'registrar', label: 'Registrar Cliente', icon: UserPlus },
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-200 flex flex-col">
            {/* Sidebar */}
            <SellerSidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                user={user}
                onLogout={() => setShowLogoutModal(true)}
            />

            {/* Main Content */}
            <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                {/* Navbar */}
                <nav className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                                title="Mostrar menu"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                        <span className="font-medium text-slate-900 dark:text-white">Fiar a Usuarios</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <NotificationBell />
                    </div>
                </nav>

                {/* Content */}
                <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fiar a Usuarios</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Otorga credito a clientes aprobados</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-border-light dark:border-border-dark">
                            <nav className="flex gap-2 overflow-x-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Tab: Fiar a Cliente */}
                        {activeTab === 'fiar' && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Pendiente</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    ${totalPending.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Fiados Pendientes</p>
                                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    {pendingFiados.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {fiadoSuccess && (
                                    <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                                        <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            {fiadoSuccess}
                                        </p>
                                    </div>
                                )}

                                {fiadoError && (
                                    <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                                        <p className="text-red-800 dark:text-red-200 flex items-center gap-2">
                                            <XCircle className="w-5 h-5" />
                                            {fiadoError}
                                        </p>
                                    </div>
                                )}

                                {/* Fiado Form */}
                                <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        Registrar Fiado a Cliente
                                    </h2>

                                    {approvedCustomers.length === 0 && !loadingCustomers ? (
                                        <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p>No hay clientes aprobados disponibles.</p>
                                            <p className="text-sm mt-1">Registra un cliente en la pestaña "Registrar Cliente" y espera la aprobacion del administrador.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleCreateFiado} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Cliente
                                                </label>
                                                <select
                                                    value={fiadoForm.customerId}
                                                    onChange={(e) => setFiadoForm({ ...fiadoForm, customerId: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                             bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                    required
                                                >
                                                    <option value="">Seleccionar cliente...</option>
                                                    {approvedCustomers.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.fullName} {c.idNumber ? `- ${c.idNumber}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Nombre del Articulo
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fiadoForm.itemName}
                                                    onChange={(e) => setFiadoForm({ ...fiadoForm, itemName: e.target.value })}
                                                    placeholder="Ej: Parlante JBL"
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                             bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                    required
                                                    maxLength="200"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Precio ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={fiadoForm.price}
                                                    onChange={(e) => setFiadoForm({ ...fiadoForm, price: e.target.value })}
                                                    placeholder="0.00"
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                             bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                                                             [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={submittingFiado}
                                                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6
                                                         rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                         flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                {submittingFiado ? 'Registrando...' : 'Registrar Fiado'}
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Fiados History */}
                                <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                                        Historial de Fiados a Clientes
                                    </h2>

                                    {loadingFiados ? (
                                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            Cargando fiados...
                                        </div>
                                    ) : customerFiados.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p>No has registrado fiados a clientes</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Cliente</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Articulo</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Precio</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Estado</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Fecha</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {customerFiados.map((fiado) => (
                                                        <tr
                                                            key={fiado.id}
                                                            className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                                                                {fiado.customerName}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                                {fiado.itemName}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-900 dark:text-white">
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
                                                                        Liquidado
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
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
                        )}

                        {/* Tab: Registrar Cliente */}
                        {activeTab === 'registrar' && (
                            <div className="space-y-6">
                                {customerSuccess && (
                                    <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                                        <p className="text-green-800 dark:text-green-200 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            {customerSuccess}
                                        </p>
                                    </div>
                                )}

                                {customerError && (
                                    <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                                        <p className="text-red-800 dark:text-red-200 flex items-center gap-2">
                                            <XCircle className="w-5 h-5" />
                                            {customerError}
                                        </p>
                                    </div>
                                )}

                                {/* Register Form */}
                                <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <UserPlus className="w-5 h-5" />
                                        Registrar Nuevo Cliente
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                        El cliente debe ser aprobado por el administrador antes de poder fiarle.
                                    </p>

                                    <form onSubmit={handleRegisterCustomer} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                value={customerForm.fullName}
                                                onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                                                placeholder="Ej: Juan Perez"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                         bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                required
                                                maxLength="150"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Cedula / Identificacion
                                            </label>
                                            <input
                                                type="text"
                                                value={customerForm.idNumber}
                                                onChange={(e) => setCustomerForm({ ...customerForm, idNumber: e.target.value })}
                                                placeholder="Ej: 0912345678"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                         bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                maxLength="20"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Telefono
                                            </label>
                                            <input
                                                type="text"
                                                value={customerForm.phoneNumber}
                                                onChange={(e) => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                                                placeholder="Ej: 0991234567"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                         bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                maxLength="20"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingCustomer}
                                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6
                                                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                                     flex items-center justify-center gap-2"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            {submittingCustomer ? 'Registrando...' : 'Registrar Cliente'}
                                        </button>
                                    </form>
                                </div>

                                {/* Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                        <div className="text-sm text-blue-900 dark:text-blue-300">
                                            <p className="font-medium">Proceso de aprobacion</p>
                                            <p className="mt-1 text-blue-700 dark:text-blue-400">
                                                Una vez registrado, el administrador revisara y aprobara al cliente. Solo podras fiar a clientes aprobados.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <SellerFooter />
            </main>

            {/* Logout Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Cerrar Sesion
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            ¿Estas seguro que deseas cerrar sesion?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => logout()}
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

export default SellerFiarUsuarios;
