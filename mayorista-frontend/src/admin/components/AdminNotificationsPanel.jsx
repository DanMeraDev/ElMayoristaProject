import { X, Eye, Calendar, DollarSign, AlertCircle, User } from 'lucide-react';

function AdminNotificationsPanel({ isOpen, onClose, pendingSales, onReviewSale }) {
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `$${(amount || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
            case 'EN_REVISION':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
            case 'PENDING':
            case 'PENDIENTE':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
                return 'En Revisión';
            case 'PENDING': return 'Pendiente';
            default: return status || 'En Revisión';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-surface-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-200 dark:border-border-dark">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ventas por Revisar</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Comprobantes pendientes</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {pendingSales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            ¡Todo revisado!
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            No hay ventas pendientes de revisión
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingSales.map((sale) => (
                            <div
                                key={sale.id}
                                className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                            #{sale.orderNumber || sale.id}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                            {sale.customerName || 'Cliente'}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(sale.status)}`}>
                                        {getStatusLabel(sale.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-slate-400">
                                        <User className="w-3.5 h-3.5" />
                                        {sale.vendorName || 'Vendedor'}
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-900 dark:text-white font-semibold">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {formatCurrency(sale.totalAmount || sale.total)}
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-slate-400 col-span-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(sale.date || sale.createdAt)}
                                    </div>
                                </div>

                                {sale.receiptImageUrl && (
                                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>Comprobante subido</span>
                                    </div>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReviewSale(sale);
                                        onClose();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Revisar Venta
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {pendingSales.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-xs text-center text-gray-600 dark:text-slate-400">
                        {pendingSales.length} {pendingSales.length === 1 ? 'venta por revisar' : 'ventas por revisar'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default AdminNotificationsPanel;
