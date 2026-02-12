import { useState, useEffect } from 'react';
import {
    CreditCard,
    Search,
    Loader2,
    AlertCircle,
    Trash2,
    Clock,
    CheckCircle,
    DollarSign,
    Users
} from 'lucide-react';
import { getAllFiados, adminDeleteFiado, getAllCustomerFiados, adminDeleteCustomerFiado } from '../../api/admin.api';

function FiadoManagement() {
    const [sellerFiados, setSellerFiados] = useState([]);
    const [customerFiados, setCustomerFiados] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        loadAllFiados();
    }, []);

    const loadAllFiados = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [sellerRes, customerRes] = await Promise.all([
                getAllFiados(),
                getAllCustomerFiados()
            ]);
            setSellerFiados((sellerRes.data || []).map(f => ({ ...f, _type: 'seller' })));
            setCustomerFiados((customerRes.data || []).map(f => ({ ...f, _type: 'customer' })));
        } catch (err) {
            console.error('Error loading fiados:', err);
            setError('Error al cargar los fiados.');
        } finally {
            setIsLoading(false);
        }
    };

    const allFiados = [...sellerFiados, ...customerFiados].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const handleDelete = async () => {
        if (!deleteModal) return;
        setIsDeleting(true);
        try {
            if (deleteModal._type === 'customer') {
                await adminDeleteCustomerFiado(deleteModal.id);
            } else {
                await adminDeleteFiado(deleteModal.id);
            }
            setDeleteModal(null);
            loadAllFiados();
        } catch (err) {
            console.error('Error deleting fiado:', err);
            setError('Error al eliminar el fiado.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredFiados = allFiados.filter(fiado => {
        const searchTarget = fiado._type === 'customer'
            ? `${fiado.sellerName} ${fiado.customerName} ${fiado.itemName}`
            : `${fiado.sellerName} ${fiado.itemName}`;
        const matchesSearch = searchTarget.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || fiado.status === statusFilter;
        const matchesType = typeFilter === 'ALL' ||
            (typeFilter === 'seller' && fiado._type === 'seller') ||
            (typeFilter === 'customer' && fiado._type === 'customer');
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPending = allFiados
        .filter(f => f.status === 'PENDING')
        .reduce((sum, f) => sum + f.price, 0);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestion de Fiados</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Visualiza y administra los fiados de vendedores y los fiados a clientes.
                        </p>
                        {!isLoading && !error && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    <div>
                                        <p className="text-xs text-orange-700 dark:text-orange-400">Total Pendiente</p>
                                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">${totalPending.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">Fiados Vendedores</p>
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{sellerFiados.length}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <p className="text-xs text-purple-700 dark:text-purple-400">Fiados a Clientes</p>
                                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-300">{customerFiados.length}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Search className="w-5 h-5" />
                    </span>
                    <input
                        className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="Buscar por vendedor, cliente o articulo..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm"
                >
                    <option value="ALL">Todos los tipos</option>
                    <option value="seller">Fiados Vendedores</option>
                    <option value="customer">Fiados a Clientes</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm"
                >
                    <option value="ALL">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="SETTLED">Liquidados</option>
                </select>
            </div>

            {/* Fiados Table */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando fiados...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <button onClick={loadAllFiados} className="mt-4 text-primary hover:underline">
                            Reintentar
                        </button>
                    </div>
                ) : filteredFiados.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? 'No se encontraron fiados con ese criterio.' : 'No hay fiados registrados.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendedor</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Articulo</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precio</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Estado</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {filteredFiados.map((fiado) => (
                                    <tr key={`${fiado._type}-${fiado.id}`} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 px-6">
                                            {fiado._type === 'customer' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                    <Users className="w-3 h-3" />
                                                    Cliente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    <CreditCard className="w-3 h-3" />
                                                    Vendedor
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="font-medium text-slate-900 dark:text-white">{fiado.sellerName}</p>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                            {fiado._type === 'customer' ? fiado.customerName : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                                            {fiado.itemName}
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                                            ${fiado.price.toFixed(2)}
                                        </td>
                                        <td className="py-4 px-6 text-center">
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
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(fiado.createdAt).toLocaleDateString('es-EC')}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => setDeleteModal(fiado)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar fiado"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Eliminar Fiado
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                            ¿Estas seguro que deseas eliminar este fiado?
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-6 space-y-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tipo: <strong className="text-slate-900 dark:text-white">{deleteModal._type === 'customer' ? 'Fiado a Cliente' : 'Fiado Vendedor'}</strong></p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Vendedor: <strong className="text-slate-900 dark:text-white">{deleteModal.sellerName}</strong></p>
                            {deleteModal._type === 'customer' && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Cliente: <strong className="text-slate-900 dark:text-white">{deleteModal.customerName}</strong></p>
                            )}
                            <p className="text-sm text-slate-500 dark:text-slate-400">Articulo: <strong className="text-slate-900 dark:text-white">{deleteModal.itemName}</strong></p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Precio: <strong className="text-slate-900 dark:text-white">${deleteModal.price.toFixed(2)}</strong></p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FiadoManagement;
