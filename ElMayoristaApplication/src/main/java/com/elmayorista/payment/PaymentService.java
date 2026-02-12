package com.elmayorista.payment;

import com.elmayorista.config.Mapper;
import com.elmayorista.notification.NotificationService;
import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleRepository;
import com.elmayorista.sale.SaleService;
import com.elmayorista.sale.SaleStatus;
import com.elmayorista.service.FileStorageService;
import com.elmayorista.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SaleRepository saleRepository;
    private final SaleService saleService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final Mapper mapper;

    @Transactional
    public PaymentDTO addPayment(CreatePaymentRequest request, MultipartFile file, User registeredBy) {
        Sale sale = saleRepository.findById(request.getSaleId())
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + request.getSaleId()));

        // Validations
        if (sale.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("La venta ya ha sido completamente pagada.");
        }

        BigDecimal totalPaid = paymentRepository.sumAmountBySale(sale);
        BigDecimal newTotalPaid = totalPaid.add(request.getAmount());

        if (newTotalPaid.compareTo(sale.getTotal()) > 0) {
            throw new IllegalArgumentException(
                    "El monto del pago excede el saldo pendiente. Saldo: " + (sale.getTotal().subtract(totalPaid)));
        }

        // Handle file upload
        String receiptUrl = null;
        if (file != null && !file.isEmpty()) {
            try {
                receiptUrl = fileStorageService.uploadFile(file, "receipts");
            } catch (IOException e) {
                throw new RuntimeException("Error al subir el archivo de comprobante.", e);
            }
        }

        // Create and save payment
        Payment payment = Payment.builder()
                .sale(sale)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .registeredBy(registeredBy)
                .notes(request.getNotes())
                .receiptUrl(receiptUrl)
                .build();
        payment = paymentRepository.save(payment);

        // Update sale payment status and calculate commission if fully paid
        if (newTotalPaid.compareTo(sale.getTotal()) == 0) {
            sale.setPaymentStatus(PaymentStatus.PAID);

            // Change sale status to UNDER_REVIEW for admin approval
            sale.setStatus(SaleStatus.UNDER_REVIEW);

            // Calculate and set commission (will be settled during cycle close)
            BigDecimal commission = saleService.calculateCommission(sale.getTotal(), sale.getCommissionPercentage());
            sale.setCommissionAmount(commission);
            // NOTE: commissionSettled remains false until cycle close

            // Clear pending sale notifications since sale is now under review
            notificationService.clearNotificationsForSale(sale.getId());

            // Notify admins that this sale is ready for review
            notificationService.notifyAdminsSaleUnderReview(sale);

        } else {
            sale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        }

        saleRepository.save(sale);

        return mapper.toPaymentDTO(payment);
    }

    /**
     * Elimina un pago solo si el vendedor es el dueño y el estado de la venta lo
     * permite
     */
    @Transactional
    public void deletePayment(Long paymentId, Long saleId, java.util.UUID sellerId) {
        // Buscar el pago
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException("Pago no encontrado con ID: " + paymentId));

        // Verificar que el pago pertenece a la venta especificada
        if (!payment.getSale().getId().equals(saleId)) {
            throw new IllegalStateException("El pago no pertenece a esta venta");
        }

        Sale sale = payment.getSale();

        // Verificar que el vendedor sea el dueño de la venta
        if (!sale.getSeller().getId().equals(sellerId)) {
            throw new IllegalStateException("No tienes permiso para eliminar este comprobante");
        }

        // Verificar que el estado permita modificación
        if (!saleService.canModifySale(sale)) {
            throw new IllegalStateException(
                    "No puedes eliminar comprobantes de una venta que ya fue revisada o aprobada. Estado actual: "
                            + sale.getStatus());
        }

        // Eliminar el pago
        paymentRepository.delete(payment);

        // Recalcular el estado de pago de la venta
        BigDecimal totalPaid = paymentRepository.sumAmountBySale(sale);

        if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
            sale.setPaymentStatus(PaymentStatus.UNPAID);
        } else if (totalPaid.compareTo(sale.getTotal()) < 0) {
            sale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        } else {
            sale.setPaymentStatus(PaymentStatus.PAID);
        }

        saleRepository.save(sale);
    }
}
