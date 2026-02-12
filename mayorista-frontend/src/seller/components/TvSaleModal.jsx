import { useState } from 'react';
import { X, Tv, CheckCircle, Loader2, User, MapPin } from 'lucide-react';
import { createTvSale } from '../../api/reports.api';

function TvSaleModal({ isOpen, onClose, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        tvSerialNumber: '',
        tvModel: '',
        price: '',
        shipping: '',
        customerName: '',
        customerIdNumber: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerCity: ''
    });

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.tvSerialNumber.trim() || !formData.tvModel.trim() || !formData.price || !formData.customerName.trim()) {
            setError('Completa los campos obligatorios.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await createTvSale({
                tvSerialNumber: formData.tvSerialNumber.trim(),
                tvModel: formData.tvModel.trim(),
                price: parseFloat(formData.price),
                shipping: formData.shipping ? parseFloat(formData.shipping) : 0,
                customerName: formData.customerName.trim(),
                customerIdNumber: formData.customerIdNumber.trim() || null,
                customerPhone: formData.customerPhone.trim() || null,
                customerEmail: formData.customerEmail.trim() || null,
                customerAddress: formData.customerAddress.trim() || null,
                customerCity: formData.customerCity.trim() || null
            });
            setSuccess(true);
            if (onSuccess) onSuccess();
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err) {
            console.error('Error creating TV sale:', err);
            setError(err.response?.data?.message || 'Error al registrar la venta. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            tvSerialNumber: '', tvModel: '', price: '', shipping: '',
            customerName: '', customerIdNumber: '', customerPhone: '',
            customerEmail: '', customerAddress: '', customerCity: ''
        });
        setSuccess(false);
        setError('');
        onClose();
    };

    const inputClass = "w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden transition-colors">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Tv className="w-5 h-5 text-primary" />
                        Venta de Televisor
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Venta Registrada</h3>
                        <p className="text-gray-500 dark:text-gray-400">La venta de televisor se registro exitosamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="px-6 py-5 space-y-5">
                            {/* TV Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Tv className="w-4 h-4" />
                                    Datos del Televisor
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Numero de Serie *</label>
                                        <input
                                            type="text"
                                            value={formData.tvSerialNumber}
                                            onChange={(e) => handleChange('tvSerialNumber', e.target.value)}
                                            placeholder="Ej: SN-ABC123456"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modelo *</label>
                                        <input
                                            type="text"
                                            value={formData.tvModel}
                                            onChange={(e) => handleChange('tvModel', e.target.value)}
                                            placeholder="Ej: Samsung 55 UHD 4K"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Precio ($) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={formData.price}
                                                onChange={(e) => handleChange('price', e.target.value)}
                                                placeholder="0.00"
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Envio ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.shipping}
                                                onChange={(e) => handleChange('shipping', e.target.value)}
                                                placeholder="0.00"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Datos del Cliente
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre *</label>
                                        <input
                                            type="text"
                                            value={formData.customerName}
                                            onChange={(e) => handleChange('customerName', e.target.value)}
                                            placeholder="Nombre completo del cliente"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cedula</label>
                                            <input
                                                type="text"
                                                value={formData.customerIdNumber}
                                                onChange={(e) => handleChange('customerIdNumber', e.target.value)}
                                                placeholder="0000000000"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Telefono</label>
                                            <input
                                                type="text"
                                                value={formData.customerPhone}
                                                onChange={(e) => handleChange('customerPhone', e.target.value)}
                                                placeholder="0999999999"
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.customerEmail}
                                            onChange={(e) => handleChange('customerEmail', e.target.value)}
                                            placeholder="cliente@email.com"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Direccion</label>
                                        <input
                                            type="text"
                                            value={formData.customerAddress}
                                            onChange={(e) => handleChange('customerAddress', e.target.value)}
                                            placeholder="Direccion de entrega"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ciudad</label>
                                        <input
                                            type="text"
                                            value={formData.customerCity}
                                            onChange={(e) => handleChange('customerCity', e.target.value)}
                                            placeholder="Ciudad"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Registrando...
                                        </>
                                    ) : (
                                        <>
                                            <Tv className="w-4 h-4" />
                                            Registrar Venta TV
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default TvSaleModal;
