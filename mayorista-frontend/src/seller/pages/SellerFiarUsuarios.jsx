import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import {
    Moon, Sun, ChevronRight, Users, UserPlus, CreditCard, Plus,
    CheckCircle, Clock, XCircle, DollarSign, Package,
    Search, AlertTriangle, MessageCircle, Loader2, ShieldCheck, Globe
} from 'lucide-react';
import SellerSidebar from '../components/SellerSidebar';
import SellerFooter from '../components/SellerFooter';
import { registerCustomer, getApprovedCustomers, createCustomerFiado, getMyCustomerFiados } from '../../api/customer.api';
import { verifyCedula, verifyRuc, verifyWhatsapp } from '../../api/verification.api';
import NotificationBell from '../../components/NotificationBell';

function SellerFiarUsuarios() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('fiar');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Register customer state
    const [customerForm, setCustomerForm] = useState({ fullName: '', idNumber: '', phoneNumber: '', idType: '' });
    const [submittingCustomer, setSubmittingCustomer] = useState(false);
    const [customerSuccess, setCustomerSuccess] = useState('');
    const [customerError, setCustomerError] = useState('');

    // ID verification state
    const [verifying, setVerifying] = useState(false);
    const [verificationData, setVerificationData] = useState(null); // { valid, type }
    const [verificationError, setVerificationError] = useState('');
    const [isForeign, setIsForeign] = useState(false);

    // WhatsApp verification state
    const [whatsappChecking, setWhatsappChecking] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState(null); // 'available' | 'unavailable'

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

    const toTitleCase = (str) =>
        str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    const handleVerifyId = async () => {
        const id = customerForm.idNumber.trim();
        if (!id) return;
        setVerifying(true);
        setVerificationError('');
        setVerificationData(null);
        setIsForeign(false);

        try {
            const res = id.length === 13 ? await verifyRuc(id) : await verifyCedula(id);
            const data = res.data;
            if (data.valid) {
                setVerificationData(data);
                setCustomerForm(prev => ({ ...prev, idType: data.type }));
            } else {
                setVerificationError('No es un documento ecuatoriano válido.');
            }
        } catch {
            setVerificationError('Error al verificar el documento.');
        } finally {
            setVerifying(false);
        }
    };

    const handleMarkForeign = (docType) => {
        setIsForeign(true);
        setVerificationData(null);
        setVerificationError('');
        setCustomerForm(prev => ({ ...prev, idType: docType, idNumber: '' }));
    };

    const handleCancelForeign = () => {
        setIsForeign(false);
        setCustomerForm(prev => ({ ...prev, idType: '', idNumber: '' }));
        setVerificationData(null);
        setVerificationError('');
    };

    const handleVerifyWhatsapp = async () => {
        let phone = customerForm.phoneNumber.trim();
        if (!phone) return;

        // Convertir a E.164 Ecuador: 0991234567 → 593991234567
        if (phone.startsWith('0')) {
            phone = '593' + phone.slice(1);
        } else if (!phone.startsWith('593')) {
            phone = '593' + phone;
        }

        setWhatsappChecking(true);
        setWhatsappStatus(null);
        try {
            const res = await verifyWhatsapp(phone);
            setWhatsappStatus(res.data.status === 'available' ? 'available' : 'unavailable');
        } catch {
            setWhatsappStatus('unavailable');
        } finally {
            setWhatsappChecking(false);
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
                idType: customerForm.idType || null,
                phoneNumber: customerForm.phoneNumber.trim() || null
            });
            setCustomerForm({ fullName: '', idNumber: '', phoneNumber: '', idType: '' });
            setVerificationData(null);
            setVerificationError('');
            setIsForeign(false);
            setWhatsappStatus(null);
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

                                    <form onSubmit={handleRegisterCustomer} className="space-y-5">

                                        {/* Cédula / RUC / Documento extranjero */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                {isForeign
                                                    ? customerForm.idType === 'PASAPORTE' ? 'Número de Pasaporte' : 'Número de Documento'
                                                    : 'Cédula / RUC'}
                                            </label>

                                            {/* Selector de tipo de documento extranjero */}
                                            {isForeign && (
                                                <div className="flex gap-2 mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomerForm(prev => ({ ...prev, idType: 'PASAPORTE' }))}
                                                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${customerForm.idType === 'PASAPORTE'
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-300 dark:border-gray-600 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                                    >
                                                        Pasaporte
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomerForm(prev => ({ ...prev, idType: 'ID_EXTRANJERO' }))}
                                                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${customerForm.idType === 'ID_EXTRANJERO'
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'border-gray-300 dark:border-gray-600 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                                    >
                                                        Cédula Extranjera
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelForeign}
                                                        className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                                                        title="Volver a cédula ecuatoriana"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={customerForm.idNumber}
                                                    onChange={(e) => {
                                                        const val = isForeign
                                                            ? e.target.value.toUpperCase().slice(0, 20)
                                                            : e.target.value.replace(/\D/g, '').slice(0, 13);
                                                        setCustomerForm(prev => ({ ...prev, idNumber: val }));
                                                        if (!isForeign) {
                                                            setVerificationData(null);
                                                            setVerificationError('');
                                                        }
                                                    }}
                                                    placeholder={isForeign ? 'Ej: AB123456 o PAS-001' : '0912345678 o 0912345678001'}
                                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                             bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                    maxLength={isForeign ? 20 : 13}
                                                />
                                                {!isForeign && (
                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyId}
                                                        disabled={verifying || (customerForm.idNumber.length !== 10 && customerForm.idNumber.length !== 13)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white
                                                                 font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                                    >
                                                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                                        {verifying ? 'Verificando...' : 'Verificar'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Resultado válido */}
                                            {verificationData?.valid && (
                                                <div className="mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
                                                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                                    <span className="font-medium">
                                                        {verificationData.type === 'CEDULA' ? 'Cédula ecuatoriana válida' : 'RUC ecuatoriano válido'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Resultado inválido con opción extranjero */}
                                            {verificationError && !isForeign && (
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                                        {verificationError}
                                                    </div>
                                                    <div className="flex items-start gap-3 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">¿El cliente es extranjero?</p>
                                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Selecciona el tipo de documento para continuar</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMarkForeign('PASAPORTE')}
                                                                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                                                >
                                                                    Pasaporte
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMarkForeign('ID_EXTRANJERO')}
                                                                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                                                >
                                                                    Cédula Extranjera
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Badge de extranjero activo */}
                                            {isForeign && (
                                                <div className="mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                                    <Globe className="w-4 h-4 flex-shrink-0" />
                                                    <span className="font-medium">
                                                        Cliente extranjero — {customerForm.idType === 'PASAPORTE' ? 'Pasaporte' : 'Cédula Extranjera'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Nombre completo (auto-llenado, siempre editable) */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Nombre Completo *
                                            </label>
                                            <input
                                                type="text"
                                                value={customerForm.fullName}
                                                onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                                                placeholder="Ej: Juan Pérez"
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                         bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                required
                                                maxLength="150"
                                            />
                                        </div>

                                        {/* Teléfono + verificación WhatsApp opcional */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Teléfono
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={customerForm.phoneNumber}
                                                    onChange={(e) => {
                                                        setCustomerForm({ ...customerForm, phoneNumber: e.target.value });
                                                        setWhatsappStatus(null);
                                                    }}
                                                    placeholder="Ej: 0991234567"
                                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                                             bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                    maxLength="20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyWhatsapp}
                                                    disabled={!customerForm.phoneNumber.trim() || whatsappChecking}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white
                                                             font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                                                    title="Verificar WhatsApp (opcional)"
                                                >
                                                    {whatsappChecking
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <MessageCircle className="w-4 h-4" />}
                                                    {whatsappChecking ? 'Verificando...' : 'WhatsApp'}
                                                </button>
                                            </div>

                                            {/* Resultado WhatsApp */}
                                            {whatsappStatus && (
                                                <div className={`mt-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                                                    whatsappStatus === 'available'
                                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                }`}>
                                                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                                    {whatsappStatus === 'available'
                                                        ? 'Tiene WhatsApp activo'
                                                        : 'No tiene WhatsApp registrado en este número'}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingCustomer || (!verificationData?.valid && !isForeign)}
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
