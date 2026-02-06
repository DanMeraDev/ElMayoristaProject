package com.elmayorista.payment;

import com.elmayorista.dto.CreatePaymentRequest;
import com.elmayorista.dto.Mapper;
import com.elmayorista.dto.PaymentDTO;
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

        } else {
            sale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        }

        saleRepository.save(sale);

        return mapper.toPaymentDTO(payment);
    }
}
