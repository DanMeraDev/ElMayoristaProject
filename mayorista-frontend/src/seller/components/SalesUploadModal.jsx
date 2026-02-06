import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadReport } from '../../api/reports.api';

function SalesUploadModal({ isOpen, onClose, onUploadSuccess }) {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [uploadError, setUploadError] = useState('');

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
                return 'bg-green-100 text-green-700';
            case 'PENDING':
            case 'PENDIENTE':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
            case 'UNDER_REVIEW':
            case 'IN_REVIEW':
            case 'EN_REVISION':
                return 'bg-blue-100 text-blue-700';
            case 'REJECTED':
            case 'RECHAZADA':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'Aprobada';
            case 'PENDING': return 'Pendiente';
            case 'UNDER_REVIEW': return 'En Revisión';
            case 'REJECTED': return 'Rechazada';
            default: return status || 'Pendiente';
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setUploadError('Solo se permiten archivos PDF.');
                return;
            }
            setSelectedFile(file);
            setUploadError('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError('');

        try {
            const response = await uploadReport(selectedFile);
            setUploadResult(response.data);
            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (error.response?.status === 400) {
                // If it's a specific message from backend (like duplicate order), use it
                const backendMessage = error.response.data?.message || (typeof error.response.data === 'string' ? error.response.data : '');

                if (backendMessage && (backendMessage.includes('ya existe') || backendMessage.includes('número de pedido'))) {
                    setUploadError(backendMessage);
                } else {
                    setUploadError('Archivo inválido o venta duplicada. Asegúrate de que sea un PDF válido y no se haya subido antes.');
                }
            } else if (error.response?.status === 409) {
                const backendMessage = error.response.data?.message || (typeof error.response.data === 'string' ? error.response.data : '');
                if (backendMessage) {
                    setUploadError(backendMessage);
                } else {
                    setUploadError('Venta duplicada. Ya existe una venta con este número de pedido.');
                }
            } else if (error.response?.status === 401) {
                setUploadError('Sesión expirada. Por favor, inicia sesión nuevamente.');
            } else if (error.response?.data?.message) {
                // Catch other specific backend errors
                setUploadError(error.response.data.message);
            } else {
                setUploadError('Error al subir el archivo. Intenta de nuevo.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setUploadError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Upload className="w-6 h-6 text-green-600 dark:text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-mayorista-text-primary dark:text-white">
                            Nueva Venta - Subir PDF
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!uploadResult ? (
                        <>
                            {/* File Input Area */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${selectedFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-500' : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 dark:bg-slate-800/30'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".pdf"
                                    className="hidden"
                                />

                                {selectedFile ? (
                                    <div>
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        </div>
                                        <p className="font-semibold text-mayorista-text-primary dark:text-white">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-4 text-sm text-mayorista-red hover:underline"
                                        >
                                            Cambiar archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Upload className="w-8 h-8 text-gray-400 dark:text-slate-400" />
                                        </div>
                                        <p className="text-mayorista-text-primary dark:text-white font-medium">
                                            Arrastra tu archivo PDF aquí
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">o</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-3 px-4 py-2 bg-mayorista-red text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors"
                                        >
                                            Seleccionar archivo
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {uploadError && (
                                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{uploadError}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Upload Result */
                        <div className="space-y-6">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">¡PDF procesado exitosamente! La venta ha sido creada.</span>
                            </div>

                            {/* Sale Info */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4">
                                <h4 className="font-semibold text-mayorista-text-primary dark:text-white mb-3">Resumen de la Venta Creada</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Cliente:</span>
                                        <p className="font-medium text-gray-800 dark:text-white">{uploadResult.customerName || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Fecha:</span>
                                        <p className="font-medium text-gray-800 dark:text-white">{formatDate(uploadResult.orderDate)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Nº de Venta:</span>
                                        <p className="font-medium text-gray-800 dark:text-white">#{uploadResult.orderNumber || uploadResult.id || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-slate-400">Estado:</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(uploadResult.status)}`}>
                                            {getStatusLabel(uploadResult.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 flex justify-between items-center">
                                <span className="font-semibold text-green-800 dark:text-green-300">Total Venta:</span>
                                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                                    {formatCurrency(uploadResult.total || uploadResult.totalAmount)}
                                </span>
                            </div>

                            {/* Report PDF Preview */}
                            {uploadResult.reportPdfUrl && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">📄 Reporte PDF Subido</p>
                                        <a
                                            href={uploadResult.reportPdfUrl}
                                            download={`Reporte-${uploadResult.orderNumber || uploadResult.id}.pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                                        >
                                            <FileText className="w-3 h-3" />
                                            Descargar PDF
                                        </a>
                                    </div>
                                    <iframe
                                        src={uploadResult.reportPdfUrl}
                                        width="100%"
                                        height="350px"
                                        className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white"
                                        title={`Reporte de Venta ${uploadResult.orderNumber || uploadResult.id}`}
                                    >
                                        Cargando PDF...
                                    </iframe>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {uploadResult ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!uploadResult && (
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Subir PDF
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SalesUploadModal;
