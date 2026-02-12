import { useState, useEffect } from 'react';
import {
    Shield,
    Search,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    CreditCard,
    Users as UsersIcon
} from 'lucide-react';
import { getAllUsers, updateSellerPermissions } from '../../api/admin.api';

function RoleManagement() {
    const [sellers, setSellers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [savingStates, setSavingStates] = useState({});
    const [successMessages, setSuccessMessages] = useState({});

    useEffect(() => {
        loadSellers();
    }, []);

    const loadSellers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await getAllUsers();
            // Handle paginated response
            const data = response.data.content || response.data;

            // Filter only active sellers (role: SELLER)
            const activeSellers = Array.isArray(data)
                ? data.filter(user => {
                    const hasSellerRole = user.roles?.includes('SELLER') || user.role === 'SELLER';
                    return hasSellerRole && user.enabled;
                })
                : [];

            setSellers(activeSellers);
        } catch (err) {
            console.error('Error loading sellers:', err);
            setError('Error al cargar la lista de vendedores.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePermissionChange = async (sellerId, permissionType, newValue) => {
        // Set saving state
        setSavingStates(prev => ({ ...prev, [`${sellerId}-${permissionType}`]: true }));

        try {
            // Call API to update permission
            const updateData = {
                [permissionType]: newValue
            };

            await updateSellerPermissions(sellerId, updateData);

            // Update local state
            setSellers(prev => prev.map(seller =>
                seller.id === sellerId
                    ? { ...seller, [permissionType]: newValue }
                    : seller
            ));

            // Show success message
            setSuccessMessages(prev => ({ ...prev, [`${sellerId}-${permissionType}`]: true }));
            setTimeout(() => {
                setSuccessMessages(prev => ({ ...prev, [`${sellerId}-${permissionType}`]: false }));
            }, 2000);
        } catch (err) {
            console.error('Error updating permission:', err);
            setError('Error al actualizar el permiso. Por favor intenta de nuevo.');
            setTimeout(() => setError(''), 3000);
        } finally {
            // Clear saving state
            setSavingStates(prev => ({ ...prev, [`${sellerId}-${permissionType}`]: false }));
        }
    };

    const filteredSellers = sellers.filter(seller =>
        seller.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPermissionCount = (seller) => {
        let count = 0;
        if (seller.canCreditSelf) count++;
        if (seller.canCreditCustomers) count++;
        return count;
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestión de Permisos de Fiado</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configura qué vendedores pueden acceder a funcionalidades de crédito (fiado). Los permisos se aplicarán inmediatamente.
                        </p>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Puede Fiar para Sí Mismo</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">El vendedor puede solicitar productos a crédito que se descontarán de sus comisiones.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <UsersIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Puede Fiar a Usuarios</p>
                                    <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">El vendedor puede otorgar crédito a clientes/usuarios finales.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                    <Search className="w-5 h-5" />
                </span>
                <input
                    className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                    placeholder="Buscar vendedor por nombre o email..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Sellers Table */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando vendedores...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <button onClick={loadSellers} className="mt-4 text-primary hover:underline">
                            Reintentar
                        </button>
                    </div>
                ) : filteredSellers.length === 0 ? (
                    <div className="text-center py-12">
                        <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            {searchTerm ? 'No se encontraron vendedores con ese criterio.' : 'No hay vendedores activos.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedor</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Fiar para Sí Mismo</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Fiar a Usuarios</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Permisos Activos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {filteredSellers.map((seller) => (
                                    <tr key={seller.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{seller.fullName}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{seller.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handlePermissionChange(seller.id, 'canCreditSelf', !seller.canCreditSelf)}
                                                    disabled={savingStates[`${seller.id}-canCreditSelf`]}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${seller.canCreditSelf ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                                        } ${savingStates[`${seller.id}-canCreditSelf`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${seller.canCreditSelf ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                                {savingStates[`${seller.id}-canCreditSelf`] && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                )}
                                                {successMessages[`${seller.id}-canCreditSelf`] && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handlePermissionChange(seller.id, 'canCreditCustomers', !seller.canCreditCustomers)}
                                                    disabled={savingStates[`${seller.id}-canCreditCustomers`]}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${seller.canCreditCustomers ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                                        } ${savingStates[`${seller.id}-canCreditCustomers`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${seller.canCreditCustomers ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                                {savingStates[`${seller.id}-canCreditCustomers`] && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                )}
                                                {successMessages[`${seller.id}-canCreditCustomers`] && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionCount(seller) === 2 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                getPermissionCount(seller) === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                {getPermissionCount(seller)}/2
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Footer */}
            {!isLoading && !error && filteredSellers.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-300">
                            <p className="font-medium">Nota sobre los permisos</p>
                            <p className="mt-1 text-blue-700 dark:text-blue-400">
                                Los cambios en los permisos se aplican inmediatamente. Los vendedores verán las nuevas funcionalidades disponibles en su próximo inicio de sesión.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoleManagement;
