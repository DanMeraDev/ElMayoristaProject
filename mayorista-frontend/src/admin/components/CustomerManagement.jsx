import { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Phone,
    CreditCard
} from 'lucide-react';
import { getAllCustomers, approveCustomer, rejectCustomer } from '../../api/customer.api';

function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState({});
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await getAllCustomers();
            setCustomers(response.data);
        } catch (err) {
            console.error('Error loading customers:', err);
            setError('Error al cargar los clientes.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await approveCustomer(id);
            loadCustomers();
        } catch (err) {
            console.error('Error approving customer:', err);
            setError('Error al aprobar el cliente.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;

        setIsRejecting(true);
        try {
            await rejectCustomer(rejectModal.id, rejectReason.trim());
            setRejectModal(null);
            setRejectReason('');
            loadCustomers();
        } catch (err) {
            console.error('Error rejecting customer:', err);
            setError('Error al rechazar el cliente.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsRejecting(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phoneNumber?.includes(searchTerm);
        const matchesStatus = statusFilter === 'ALL' || customer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = customers.filter(c => c.status === 'PENDING').length;
    const approvedCount = customers.filter(c => c.status === 'APPROVED').length;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <Clock className="w-3 h-3" />
                        Pendiente
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3" />
                        Aprobado
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <XCircle className="w-3 h-3" />
                        Rechazado
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestion de Clientes</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Aprueba o rechaza los clientes registrados por los vendedores. Solo los clientes aprobados podran recibir credito.
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                <div>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400">Pendientes</p>
                                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">{pendingCount}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="text-xs text-green-700 dark:text-green-400">Aprobados</p>
                                    <p className="text-sm font-semibold text-green-900 dark:text-green-300">{approvedCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Search className="w-5 h-5" />
                    </span>
                    <input
                        className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                        placeholder="Buscar por nombre, cedula o telefono..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm"
                >
                    <option value="ALL">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="APPROVED">Aprobados</option>
                    <option value="REJECTED">Rechazados</option>
                </select>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </p>
                </div>
            )}

            {/* Customers Table */}
            <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                        <p className="mt-4 text-slate-500 dark:text-slate-400">Cargando clientes...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            {searchTerm || statusFilter !== 'ALL' ? 'No se encontraron clientes con ese criterio.' : 'No hay clientes registrados.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cedula</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Telefono</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registrado por</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Estado</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-4 px-6">
                                            <p className="font-medium text-slate-900 dark:text-white">{customer.fullName}</p>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                            {customer.idNumber || '-'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                            {customer.phoneNumber ? (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {customer.phoneNumber}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-sm">
                                            {customer.registeredByName}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {getStatusBadge(customer.status)}
                                            {customer.status === 'REJECTED' && customer.rejectionReason && (
                                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{customer.rejectionReason}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(customer.createdAt).toLocaleDateString('es-EC')}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {customer.status === 'PENDING' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(customer.id)}
                                                        disabled={actionLoading[customer.id]}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        {actionLoading[customer.id] ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="w-3 h-3" />
                                                        )}
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal(customer)}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-sm w-full p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Rechazar Cliente
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-2">
                            ¿Estas seguro que deseas rechazar a <strong>{rejectModal.fullName}</strong>?
                        </p>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Motivo del rechazo *
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Escribe el motivo del rechazo..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                         bg-white dark:bg-gray-700 text-slate-900 dark:text-white
                                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                                rows="3"
                                required
                            />
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                                disabled={isRejecting}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isRejecting || !rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CustomerManagement;
