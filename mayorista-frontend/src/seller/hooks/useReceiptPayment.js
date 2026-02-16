import { useState, useRef, useCallback } from 'react';
import { getSaleDetails, registerPaymentWithReceipt } from '../../api/reports.api';

export default function useReceiptPayment({ onSuccess, formatCurrency }) {
  const receiptInputRef = useRef(null);

  // Receipt upload state
  const [saleForReceipt, setSaleForReceipt] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState('');

  // Payment state
  const [paymentType, setPaymentType] = useState('FULL');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [salePaymentInfo, setSalePaymentInfo] = useState(null);
  const [loadingSaleInfo, setLoadingSaleInfo] = useState(false);

  const resetState = useCallback(() => {
    setSaleForReceipt(null);
    setReceiptFile(null);
    setReceiptUploadError('');
    setPaymentType('FULL');
    setPaymentAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentNotes('');
    setSalePaymentInfo(null);
    setLoadingSaleInfo(false);
  }, []);

  const openReceiptModal = useCallback(async (sale, e) => {
    e?.stopPropagation();
    setSaleForReceipt(sale);
    setReceiptFile(null);
    setReceiptUploadError('');
    setPaymentType('FULL');
    setPaymentAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentNotes('');
    setSalePaymentInfo(null);

    setLoadingSaleInfo(true);
    try {
      const response = await getSaleDetails(sale.id);
      const saleData = response.data;
      setSalePaymentInfo({
        total: saleData.total || saleData.totalAmount || sale.total || sale.totalAmount || 0,
        totalPaid: saleData.totalPaid || 0,
        remainingAmount: saleData.remainingAmount ?? (saleData.total || saleData.totalAmount || sale.total || sale.totalAmount || 0),
        paymentStatus: saleData.paymentStatus || 'UNPAID'
      });
    } catch {
      setSalePaymentInfo({
        total: sale.total || sale.totalAmount || 0,
        totalPaid: 0,
        remainingAmount: sale.total || sale.totalAmount || 0,
        paymentStatus: 'UNPAID'
      });
    } finally {
      setLoadingSaleInfo(false);
    }
  }, []);

  const handleReceiptSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setReceiptUploadError('Solo se permiten imagenes (JPG, PNG, WEBP) o PDF.');
        return;
      }
      setReceiptFile(file);
      setReceiptUploadError('');
    }
  }, []);

  const getPaymentAmountToRegister = useCallback(() => {
    if (!salePaymentInfo) return 0;
    if (paymentType === 'FULL') {
      return salePaymentInfo.remainingAmount;
    }
    return parseFloat(paymentAmount) || 0;
  }, [salePaymentInfo, paymentType, paymentAmount]);

  const handleReceiptUpload = useCallback(async () => {
    if (!receiptFile || !saleForReceipt) return;

    const amountToRegister = getPaymentAmountToRegister();

    if (amountToRegister <= 0) {
      setReceiptUploadError('El monto del pago debe ser mayor a 0.');
      return;
    }

    if (salePaymentInfo && amountToRegister > salePaymentInfo.remainingAmount) {
      setReceiptUploadError(`El monto no puede exceder el saldo pendiente de ${formatCurrency(salePaymentInfo.remainingAmount)}.`);
      return;
    }

    setIsUploadingReceipt(true);
    setReceiptUploadError('');

    try {
      await registerPaymentWithReceipt(
        saleForReceipt.id,
        amountToRegister,
        paymentMethod,
        paymentNotes || (paymentType === 'FULL' ? 'Pago completo' : `Abono parcial de ${formatCurrency(amountToRegister)}`),
        receiptFile
      );
      resetState();
      onSuccess?.();
    } catch (error) {
      console.error('Receipt upload error:', error);
      if (error.response?.status === 400) {
        setReceiptUploadError('Error en el pago o archivo invalido. Intenta de nuevo.');
      } else if (error.response?.status === 401) {
        setReceiptUploadError('Sesion expirada. Por favor, inicia sesion nuevamente.');
      } else {
        setReceiptUploadError(error.response?.data?.message || 'Error al procesar el pago. Intenta de nuevo.');
      }
    } finally {
      setIsUploadingReceipt(false);
    }
  }, [receiptFile, saleForReceipt, getPaymentAmountToRegister, salePaymentInfo, paymentMethod, paymentNotes, paymentType, formatCurrency, resetState, onSuccess]);

  return {
    receiptInputRef,
    saleForReceipt,
    receiptFile,
    isUploadingReceipt,
    receiptUploadError,
    paymentType,
    setPaymentType,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    paymentNotes,
    setPaymentNotes,
    salePaymentInfo,
    loadingSaleInfo,
    openReceiptModal,
    handleReceiptSelect,
    handleReceiptUpload,
    closeReceiptModal: resetState,
    getPaymentAmountToRegister,
  };
}
