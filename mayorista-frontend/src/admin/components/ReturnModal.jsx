import { useState } from 'react';
import { X, RotateCcw, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { processSaleReturn } from '../../api/admin.api';

function ReturnModal({ sale, onClose, onSuccess }) {
    const [returnType, setReturnType] = useState('REFUND');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Debes ingresar el motivo de la devolución.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await processSaleReturn(sale.id, returnType, reason.trim());
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Error al procesar la devolución.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) =>
        new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val ?? 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => !loading && onClose()} />
            <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-orange-500" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Procesar Devolución</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Sale info */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-1">
                        <p className="text-xs text-gray-500 dark:text-slate-400">Venta a devolver</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {sale.orderNumber || `#${sale.id}`} — {sale.customerName}
                        </p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.total)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Vendedor: {sale.sellerName}</p>
                    </div>

                    {/* Return type */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Tipo de devolución</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setReturnType('REFUND')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    returnType === 'REFUND'
                                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500'
                                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                                }`}
                            >
                                <RotateCcw className={`w-6 h-6 ${returnType === 'REFUND' ? 'text-red-500' : 'text-gray-400'}`} />
                                <div className="text-center">
                                    <p className={`text-sm font-semibold ${returnType === 'REFUND' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-slate-400'}`}>
                                        Reembolso
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">Devolver dinero</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setReturnType('EXCHANGE')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                    returnType === 'EXCHANGE'
                                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                                }`}
                            >
                                <RefreshCw className={`w-6 h-6 ${returnType === 'EXCHANGE' ? 'text-blue-500' : 'text-gray-400'}`} />
                                <div className="text-center">
                                    <p className={`text-sm font-semibold ${returnType === 'EXCHANGE' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}>
                                        Cambio
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">Cambio de producto</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                            Motivo <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Ej: Producto defectuoso, el cliente reportó que no enciende..."
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            La comisión de esta venta se anulará a <strong>$0.00</strong>.
                            {returnType === 'EXCHANGE' && ' Deberás registrar la venta del producto de cambio por separado.'}
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !reason.trim()}
                        className={`flex-1 py-2.5 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm ${
                            returnType === 'REFUND'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                        ) : (
                            <>{returnType === 'REFUND' ? <RotateCcw className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                            Confirmar {returnType === 'REFUND' ? 'Reembolso' : 'Cambio'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReturnModal;
