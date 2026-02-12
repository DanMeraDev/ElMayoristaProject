package com.elmayorista.admin;

import com.elmayorista.config.Mapper;
import com.elmayorista.sale.SaleDTO;
import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleService;
import com.elmayorista.user.AdminDashboardStats;
import com.elmayorista.user.User;
import com.elmayorista.user.UserService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.elmayorista.service.ExcelReportService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import jakarta.validation.Valid;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import java.util.Map;

import com.elmayorista.notification.NotificationService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final ExcelReportService excelReportService;
    private final SaleService saleService;
    private final NotificationService notificationService;
    private final Mapper mapper;

    // DTO anidado para la solicitud de revisión
    public record ReviewRequest(boolean approved, String rejectionReason) {
    }

    /**
     * Revisa una venta, la aprueba (y calcula comisión) o la rechaza.
     * 
     * @param id      El ID de la venta a revisar.
     * @param request El cuerpo de la solicitud con el estado de aprobación y
     *                motivo.
     * @return La venta actualizada.
     */
    @PostMapping("/sales/{id}/review")
    public ResponseEntity<SaleDTO> reviewSale(@PathVariable Long id, @Valid @RequestBody ReviewRequest request) {
        Sale reviewedSale = saleService.reviewSale(id, request.approved(), request.rejectionReason());
        return ResponseEntity.ok(mapper.toSaleDTO(reviewedSale));
    }

    /**
     * Obtiene todas las ventas que están en estado "UNDER_REVIEW".
     * 
     * @param pageable Configuración de paginación.
     * @return Página de ventas para revisar.
     */
    @GetMapping("/sales/under-review")
    public ResponseEntity<Page<SaleDTO>> getSalesUnderReview(Pageable pageable) {
        Page<Sale> sales = saleService.getSalesByStatus(com.elmayorista.sale.SaleStatus.UNDER_REVIEW, pageable);
        return ResponseEntity.ok(sales.map(mapper::toSaleDTO));
    }

    /**
     * Obtiene el historial completo de ventas (para admin)
     */
    @GetMapping("/sales")
    public ResponseEntity<Page<SaleDTO>> getAllSales(Pageable pageable) {
        Page<Sale> sales = saleService.getAllSales(pageable);
        return ResponseEntity.ok(sales.map(mapper::toSaleDTO));
    }

    /**
     * Descarga el reporte de liquidación en Excel
     */
    @GetMapping("/reports/settlement")
    public ResponseEntity<Resource> downloadSettlementReport() throws IOException {
        ByteArrayInputStream in = excelReportService.generateSettlementReport();
        InputStreamResource file = new InputStreamResource(in);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Liquidacion.xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    /**
     * Endpoint para que un ADMIN apruebe a un seller.
     * Protegido por SecurityConfig para que solo administradores puedan acceder.
     * 
     * @param userId ID del usuario (seller) a aprobar.
     * @return El usuario actualizado.
     */
    @PostMapping("/sellers/{userId}/approve")
    public ResponseEntity<User> approveSeller(@PathVariable UUID userId) {
        User approvedUser = userService.approveVendorAndSendEmail(userId);
        return ResponseEntity.ok(approvedUser);
    }

    /**
     * Endpoint para que un ADMIN rechace a un seller.
     * 
     * @param userId ID del usuario (seller) a rechazar.
     * @param body   Mapa con la razón ("reason").
     * @return Mensaje de confirmación.
     */
    @PostMapping("/sellers/{userId}/reject")
    public ResponseEntity<?> rejectSeller(@PathVariable UUID userId, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        userService.rejectVendor(userId, reason);
        return ResponseEntity.ok(Map.of("message", "Vendedor rechazado y eliminado exitosamente."));
    }

    /**
     * Obtiene todos los sellers pendientes de aprobación
     * 
     * @return Lista de sellers pendientes
     */
    @GetMapping("/sellers/pending")
    public ResponseEntity<List<User>> getPendingSellers() {
        return ResponseEntity.ok(userService.getPendingVendors());
    }

    /**
     * Actualiza la comisión de un seller
     * 
     * @param userId               ID del seller
     * @param commissionPercentage Nuevo porcentaje de comisión
     * @return Seller actualizado
     */
    @PutMapping("/sellers/{userId}/commission")
    public ResponseEntity<User> updateSellerCommission(
            @PathVariable UUID userId,
            @RequestParam BigDecimal commissionPercentage) {
        User updatedUser = userService.updateVendorCommission(userId, commissionPercentage);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Obtiene las estadísticas del panel de administración
     * 
     * @return Estadísticas del dashboard
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(userService.getAdminDashboardStats());
    }

    /**
     * Obtiene todos los sellers (paginado)
     * 
     * @param pageable Configuración de paginación
     * @return Página de sellers
     */
    @GetMapping("/sellers")
    public ResponseEntity<Page<User>> getAllSellers(Pageable pageable) {
        return ResponseEntity.ok(userService.getAllVendorsPaginated(pageable));
    }

    /**
     * Habilita o deshabilita a un seller
     * 
     * @param userId  ID del seller
     * @param enabled true para habilitar, false para deshabilitar
     * @return Seller actualizado
     */
    @PutMapping("/sellers/{userId}/enabled")
    public ResponseEntity<User> toggleSellerEnabled(
            @PathVariable UUID userId,
            @RequestParam boolean enabled) {
        User updatedUser = userService.toggleSellerEnabled(userId, enabled);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * Envía una notificación manual al vendedor sobre una venta.
     *
     * @param saleId  ID de la venta
     * @param body    channel: "EMAIL", "PLATFORM" o "BOTH"
     */
    @PostMapping("/sales/{saleId}/notify")
    public ResponseEntity<Map<String, String>> notifySeller(
            @PathVariable Long saleId,
            @RequestBody Map<String, String> body) {
        String channel = body.getOrDefault("channel", "BOTH");
        notificationService.sendManualNotification(saleId, channel);
        return ResponseEntity.ok(Map.of("message", "Notificacion enviada exitosamente"));
    }
}
