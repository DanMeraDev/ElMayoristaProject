import { X, DollarSign, FileText, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react';

function SaleDetailModal({ sale, onClose, children, userCommission }) {
    if (!sale) return null;

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
            case 'APPROVED':
            case 'APROBADA':
                return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800';
            case 'PENDING':
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
            case 'EN_REVISION':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
            case 'REJECTED':
            case 'RECHAZADA':
                return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'Aprobada';
            case 'PENDING': return 'Pendiente';
            case 'UNDER_REVIEW': return 'En Revisión';
            case 'IN_REVIEW': return 'En Revisión';
            case 'REJECTED': return 'Rechazada';
            default: return status || 'Pendiente';
        }
    };

    const commissionPercent = sale.commissionPercentage || userCommission || 5;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-surface-dark px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between z-10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Detalle Venta #{sale.orderNumber || sale.id}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 Transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Sale Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                            <p className="font-medium text-gray-800 dark:text-white">{sale.customerName || sale.clientName || sale.customer?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                            <p className="font-medium text-gray-800 dark:text-white">{formatDate(sale.orderDate || sale.date || sale.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                            <span className={`text-xs px-2 py-1 rounded-full border inline-block ${getStatusColor(sale.status)}`}>
                                {getStatusLabel(sale.status)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Número de Orden</p>
                            <p className="font-medium text-gray-800 dark:text-white">#{sale.orderNumber || sale.id}</p>
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {sale.status?.toUpperCase() === 'REJECTED' && sale.rejectionReason && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Motivo del Rechazo:</p>
                            <p className="text-sm text-red-600 dark:text-red-300">{sale.rejectionReason}</p>
                        </div>
                    )}

                    {/* Amounts */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span className="text-gray-800 dark:text-white">{formatCurrency(sale.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Envío</span>
                            <span className="text-gray-800 dark:text-white">{formatCurrency(sale.shippingCost || sale.shipping || 0)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <span className="text-gray-800 dark:text-white">Total Venta</span>
                            <span className="text-mayorista-red text-red-600 dark:text-red-400">{formatCurrency(sale.totalAmount || sale.total)}</span>
                        </div>
                    </div>

                    {/* Commission */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-400">Comisión ({commissionPercent}%)</p>
                                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                                    {formatCurrency(sale.commissionAmount)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-500 dark:text-green-400" />
                        </div>
                    </div>

                    {/* Receipt Image */}
                    {sale.receiptImageUrl && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Comprobante</p>
                            <img
                                src={sale.receiptImageUrl}
                                alt="Comprobante"
                                className="rounded-lg max-w-full h-auto border border-gray-200 dark:border-gray-700"
                            />
                        </div>
                    )}

                    {/* Payments List (if detailed payments exist) */}
                    {sale.payments && sale.payments.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Historial de Pagos</p>
                            <div className="space-y-3">
                                {sale.payments.map((payment, index) => (
                                    <div key={payment.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Pago #{index + 1}</span>
                                            <span className="text-gray-500 dark:text-gray-400">{formatDate(payment.paymentDate)}</span>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Monto:</span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                                            </div>
                                            {payment.receiptUrl && (
                                                <div className="mt-2">
                                                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                        <ImageIcon className="w-3 h-3" /> Ver Comprobante
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Report PDF */}
                    {sale.reportPdfUrl && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Reporte PDF</p>
                                <a
                                    href={sale.reportPdfUrl}
                                    download={`Reporte-${sale.orderNumber || sale.id}.pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline flex items-center gap-1"
                                >
                                    <FileText className="w-3 h-3" />
                                    Descargar PDF
                                </a>
                            </div>
                            <iframe
                                src={sale.reportPdfUrl}
                                width="100%"
                                height="300px"
                                className="rounded-lg border border-gray-200 dark:border-gray-700"
                                title={`Reporte de Venta ${sale.orderNumber || sale.id}`}
                            >
                                Cargando PDF...
                            </iframe>
                        </div>
                    )}

                    {/* Action Buttons (Passed as children) */}
                    {children && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                            {children}
                        </div>
                    )}

                    {!children && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 mt-4 -mx-6 -mb-6">
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SaleDetailModal;
