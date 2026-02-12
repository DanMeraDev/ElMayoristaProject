package com.elmayorista.sale;

import com.elmayorista.notification.NotificationService;
import com.elmayorista.service.FileStorageService;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public BigDecimal calculateCommission(BigDecimal total, BigDecimal percentage) {
        if (percentage == null) {
            percentage = BigDecimal.ZERO;
        }
        return total.multiply(percentage.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional
    public Sale createSale(Sale sale) {
        if (sale.getOrderDate() == null) {
            sale.setOrderDate(LocalDateTime.now());
        }

        // Normalizar número de orden
        if (sale.getOrderNumber() != null) {
            sale.setOrderNumber(sale.getOrderNumber().trim());
        }

        // Validar si ya existe una venta con el mismo número de orden
        if (sale.getOrderNumber() != null && saleRepository.existsByOrderNumber(sale.getOrderNumber())) {
            throw new IllegalArgumentException(
                    "La venta con número de pedido " + sale.getOrderNumber() + " ya existe.");
        }

        User seller = sale.getSeller();
        if (seller != null && seller.getCommissionPercentage() != null) {
            sale.setCommissionPercentage(seller.getCommissionPercentage());
        } else {
            sale.setCommissionPercentage(new BigDecimal("5.00")); // Default commission
        }

        // Commission is NOT calculated on creation anymore.
        // It will be calculated when an admin approves the sale.
        sale.setCommissionAmount(BigDecimal.ZERO);
        sale.setCommissionSettled(false);

        sale.setStatus(SaleStatus.PENDING);

        return saleRepository.save(sale);
    }

    @Transactional
    public Sale reviewSale(Long id, boolean isApproved, String rejectionReason) {
        Sale sale = getSaleById(id);

        if (sale.getStatus() != SaleStatus.UNDER_REVIEW) {
            throw new IllegalStateException(
                    "Solo se puede revisar una venta que esté EN REVISIÓN. Estado actual: " + sale.getStatus());
        }

        if (isApproved) {
            sale.setStatus(SaleStatus.APPROVED);
            sale.setRejectionReason(null);

        } else {
            if (rejectionReason == null || rejectionReason.isBlank()) {
                throw new IllegalArgumentException("Se requiere un motivo de rechazo.");
            }
            sale.setStatus(SaleStatus.REJECTED);
            sale.setRejectionReason(rejectionReason);

            // Reset commission fields
            sale.setCommissionAmount(BigDecimal.ZERO);
            sale.setCommissionSettled(false);
        }

        Sale saved = saleRepository.save(sale);

        // Clear any pending sale reminder notifications
        notificationService.clearNotificationsForSale(sale.getId());

        return saved;
    }

    @Transactional
    public Sale updateSaleStatus(Long id, SaleStatus newStatus) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + id));

        validateStatusChange(sale.getStatus(), newStatus);

        sale.setStatus(newStatus);
        return saleRepository.save(sale);
    }

    private void validateStatusChange(SaleStatus currentStatus, SaleStatus newStatus) {
        if (currentStatus == SaleStatus.REJECTED && newStatus == SaleStatus.APPROVED) {
            throw new IllegalStateException("No se puede aprobar una venta que ya fue rechazada");
        }
        if (currentStatus == SaleStatus.APPROVED &&
                (newStatus == SaleStatus.PENDING || newStatus == SaleStatus.UNDER_REVIEW)) {
            throw new IllegalStateException("No se puede retroceder el estado de una venta aprobada");
        }
    }

    @Transactional
    public Sale recalculateCommission(Long id, BigDecimal newPercentage) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + id));

        sale.setCommissionPercentage(newPercentage);
        sale.setCommissionAmount(calculateCommission(sale.getTotal(), newPercentage));

        return saleRepository.save(sale);
    }

    @Transactional(readOnly = true)
    public Page<Sale> getSalesBySeller(UUID sellerId, Pageable pageable) {
        User seller = userService.getUserById(sellerId);
        return saleRepository.findBySeller(seller, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Sale> getSalesByStatus(SaleStatus status, Pageable pageable) {
        return saleRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Sale> getAllSales(Pageable pageable) {
        return saleRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalCommissionForSeller(UUID sellerId) {
        User seller = userService.getUserById(sellerId);
        BigDecimal result = saleRepository.sumCommissionAmountBySeller(seller);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<Sale> getSalesBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return saleRepository.findSalesBetweenDates(startDate, endDate);
    }

    @Transactional(readOnly = true)
    public BigDecimal getCommissionForSellerInCurrentMonth(UUID sellerId) {
        User seller = userService.getUserById(sellerId);
        return saleRepository.sumUnsettledApprovedCommissionBySeller(seller);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalSalesByStatus(SaleStatus status) {
        BigDecimal result = saleRepository.sumTotalByStatus(status);
        return result != null ? result : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Page<Sale> getAllSalesPaginated(Pageable pageable) {
        return saleRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Sale getSaleById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Venta no encontrada con ID: " + id));
    }

    @Transactional(readOnly = true)
    public Sale getSaleByOrderNumber(String orderNumber) {
        return saleRepository.findByOrderNumber(orderNumber)
                .orElseThrow(
                        () -> new EntityNotFoundException("Venta no encontrada con número de orden: " + orderNumber));
    }

    @Transactional
    public Sale updateSale(Long id, Sale updatedSale) {
        Sale existingSale = getSaleById(id);

        existingSale.setCustomerName(updatedSale.getCustomerName());
        existingSale.setSubtotal(updatedSale.getSubtotal());
        existingSale.setShipping(updatedSale.getShipping());
        existingSale.setTotal(updatedSale.getTotal());

        if (!existingSale.getCommissionPercentage().equals(updatedSale.getCommissionPercentage())) {
            existingSale.setCommissionPercentage(updatedSale.getCommissionPercentage());
            existingSale.setCommissionAmount(calculateCommission(
                    existingSale.getTotal(), existingSale.getCommissionPercentage()));
        }

        return saleRepository.save(existingSale);
    }

    /**
     * Verifica si una venta puede ser modificada o eliminada
     * Solo se permite si está en estado PENDING o REJECTED
     */
    public boolean canModifySale(Sale sale) {
        return sale.getStatus() == SaleStatus.PENDING || sale.getStatus() == SaleStatus.REJECTED;
    }

    /**
     * Elimina una venta solo si el vendedor es el dueño y el estado lo permite
     */
    @Transactional
    public void deleteSale(Long id, UUID sellerId) {
        Sale sale = getSaleById(id);

        // Verificar que el vendedor sea el dueño de la venta
        if (!sale.getSeller().getId().equals(sellerId)) {
            throw new IllegalStateException("No tienes permiso para eliminar esta venta");
        }

        // Verificar que el estado permita eliminación
        if (!canModifySale(sale)) {
            throw new IllegalStateException(
                    "No puedes eliminar una venta que ya fue revisada o aprobada. Estado actual: " + sale.getStatus());
        }

        saleRepository.deleteById(id);
    }
}
