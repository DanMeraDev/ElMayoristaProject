package com.elmayorista.notification;

import com.elmayorista.customer.Customer;
import com.elmayorista.customer.CustomerFiado;
import com.elmayorista.fiado.Fiado;
import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleRepository;
import com.elmayorista.sale.SaleStatus;
import com.elmayorista.service.EmailService;
import com.elmayorista.user.Role;
import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SaleRepository saleRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(50)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotificationsPaginated(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Notificacion no encontrada"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalStateException("No tienes permiso para modificar esta notificacion");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public void sendManualNotification(Long saleId, String channel) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Venta no encontrada"));

        User seller = sale.getSeller();
        String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
        String customerName = sale.getCustomerName() != null ? sale.getCustomerName() : "Sin nombre";
        long daysPending = java.time.temporal.ChronoUnit.DAYS.between(sale.getOrderDate(), LocalDateTime.now());

        boolean sendEmail = "EMAIL".equals(channel) || "BOTH".equals(channel);
        boolean sendPlatform = "PLATFORM".equals(channel) || "BOTH".equals(channel);

        if (sendPlatform) {
            Notification notification = Notification.builder()
                    .user(seller)
                    .type(NotificationType.SALE_PENDING_REMINDER)
                    .title("Recordatorio de pago")
                    .message("Venta " + orderNum + " - " + customerName + " (enviado por admin)")
                    .referenceId(sale.getId())
                    .referenceDate(sale.getOrderDate())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }

        if (sendEmail) {
            emailService.sendPendingSaleReminderToSeller(
                    seller.getEmail(),
                    seller.getFullName(),
                    orderNum,
                    customerName,
                    sale.getTotal().toPlainString(),
                    daysPending);
        }

        log.info("Manual notification sent for sale {} via {} to seller {}",
                saleId, channel, seller.getEmail());
    }

    @Transactional
    public void clearNotificationsForSale(Long saleId) {
        List<Notification> notifications = notificationRepository
                .findByReferenceIdAndTypeIn(saleId, List.of(
                        NotificationType.SALE_PENDING_REMINDER,
                        NotificationType.SALE_PENDING_ADMIN_ALERT,
                        NotificationType.SALE_UNDER_REVIEW));
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
            log.info("Cleared {} notifications for sale {}", notifications.size(), saleId);
        }
    }

    @Transactional
    public void notifyAdminsSaleCreated(Sale sale) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
        String sellerName = sale.getSeller().getFullName();
        String saleType = sale.getSaleType() != null && sale.getSaleType().name().equals("TV") ? " (TV)" : "";

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .type(NotificationType.SALE_CREATED)
                    .title("Nueva venta registrada" + saleType)
                    .message(sellerName + " registró la venta " + orderNum + ". Total: $" + sale.getTotal().toPlainString())
                    .referenceId(sale.getId())
                    .referenceDate(sale.getOrderDate())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Notified {} admins about new sale {} created by {}", admins.size(), sale.getId(), sellerName);
    }

    @Transactional
    public void notifyAdminsSaleUnderReview(Sale sale) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
        String sellerName = sale.getSeller().getFullName();

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .type(NotificationType.SALE_UNDER_REVIEW)
                    .title("Venta pendiente de revision")
                    .message("La venta " + orderNum + " de " + sellerName + " esta lista para revision. Total: $" + sale.getTotal().toPlainString())
                    .referenceId(sale.getId())
                    .referenceDate(sale.getOrderDate())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Notified {} admins about sale {} under review", admins.size(), sale.getId());
    }

    @Transactional
    public void notifyAdminsCustomerFiadoCreated(CustomerFiado fiado) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        String sellerName = fiado.getSeller().getFullName();
        String customerName = fiado.getCustomer().getFullName();

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .type(NotificationType.CUSTOMER_FIADO_CREATED)
                    .title("Nuevo fiado a cliente")
                    .message("El vendedor " + sellerName + " fió \"" + fiado.getItemName() + "\" por $" + fiado.getPrice().toPlainString() + " al cliente " + customerName)
                    .referenceId(fiado.getId())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }
        log.info("Notified {} admins about customer fiado {} by seller {}", admins.size(), fiado.getId(), sellerName);
    }

    @Transactional
    public void notifySellerFiadoApproved(User seller, Long fiadoId, String itemName, boolean isCustomerFiado, String customerName) {
        String context = isCustomerFiado ? " al cliente " + customerName : "";
        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.FIADO_APPROVED)
                .title("Fiado aprobado")
                .message("Tu fiado de \"" + itemName + "\"" + context + " fue aprobado.")
                .referenceId(fiadoId)
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notified seller {} that fiado {} was approved", seller.getFullName(), fiadoId);
    }

    @Transactional
    public void notifySellerFiadoRejected(User seller, Long fiadoId, String itemName, boolean isCustomerFiado, String customerName) {
        String context = isCustomerFiado ? " al cliente " + customerName : "";
        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.FIADO_REJECTED)
                .title("Fiado rechazado")
                .message("Tu fiado de \"" + itemName + "\"" + context + " fue rechazado por el administrador.")
                .referenceId(fiadoId)
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notified seller {} that fiado {} was rejected", seller.getFullName(), fiadoId);
    }

    @Transactional
    public void notifySellerCustomerApproved(Customer customer) {
        User seller = customer.getRegisteredBy();
        String idInfo = customer.getIdNumber() != null ? " (" + customer.getIdNumber() + ")" : "";

        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.CUSTOMER_APPROVED)
                .title("Cliente aprobado")
                .message("Tu cliente " + customer.getFullName() + idInfo + " fue aprobado. Ya puedes fiarle.")
                .referenceId(customer.getId())
                .read(false)
                .build();
        notificationRepository.save(notification);

        log.info("Notified seller {} that customer {} was approved", seller.getFullName(), customer.getId());
    }

    @Transactional
    public void notifyAdminsCustomerRegistered(Customer customer) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        String sellerName = customer.getRegisteredBy().getFullName();
        String idInfo = customer.getIdNumber() != null ? " (" + customer.getIdNumber() + ")" : "";

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .type(NotificationType.CUSTOMER_REGISTERED)
                    .title("Nuevo cliente por aprobar")
                    .message("El vendedor " + sellerName + " registró al cliente: " + customer.getFullName() + idInfo)
                    .referenceId(customer.getId())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Notified {} admins about new customer {} by seller {}", admins.size(), customer.getId(), sellerName);
    }

    @Transactional
    public void notifySellerSaleApproved(Sale sale) {
        User seller = sale.getSeller();
        String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.SALE_APPROVED)
                .title("Venta aprobada")
                .message("Tu venta " + orderNum + " fue aprobada por el administrador. Total: $" + sale.getTotal().toPlainString())
                .referenceId(sale.getId())
                .referenceDate(sale.getOrderDate())
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notified seller {} that sale {} was approved", seller.getFullName(), sale.getId());
    }

    @Transactional
    public void notifySellerSaleRejected(Sale sale) {
        User seller = sale.getSeller();
        String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
        String reason = sale.getRejectionReason() != null ? " Motivo: " + sale.getRejectionReason() : "";
        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.SALE_REJECTED)
                .title("Venta rechazada")
                .message("Tu venta " + orderNum + " fue rechazada." + reason)
                .referenceId(sale.getId())
                .referenceDate(sale.getOrderDate())
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notified seller {} that sale {} was rejected", seller.getFullName(), sale.getId());
    }

    @Transactional
    public void notifySellerSaleReturned(Sale sale) {
        User seller = sale.getSeller();
        String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
        String typeLabel = sale.getReturnType() == com.elmayorista.sale.ReturnType.REFUND ? "reembolso" : "cambio";
        String reason = sale.getReturnReason() != null ? " Motivo: " + sale.getReturnReason() : "";
        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.SALE_RETURNED)
                .title("Venta devuelta (" + typeLabel + ")")
                .message("Tu venta " + orderNum + " fue procesada como " + typeLabel + "." + reason)
                .referenceId(sale.getId())
                .referenceDate(sale.getOrderDate())
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notified seller {} that sale {} was returned ({})", seller.getFullName(), sale.getId(), typeLabel);
    }

    /**
     * Checks the seller's ranking position after a sale is approved.
     * If they've reached top 1, 2, or 3 — sends a one-time achievement notification.
     */
    @Transactional
    public void checkAndNotifyRankingAchievement(User seller) {
        var ranking = saleRepository.findTopSellersByApprovedSales(
                org.springframework.data.domain.PageRequest.of(0, 3));

        int position = 0;
        for (int i = 0; i < ranking.size(); i++) {
            if (ranking.get(i).getSellerId().equals(seller.getId())) {
                position = i + 1;
                break;
            }
        }

        if (position < 1 || position > 3) return;

        // Check if we already sent a notification for this exact position
        Optional<Notification> existing = notificationRepository.findByUserIdAndReferenceIdAndType(
                seller.getId(), (long) position, NotificationType.RANKING_ACHIEVEMENT);
        if (existing.isPresent()) return;

        String[] posLabels = {"", "1er", "2do", "3er"};
        String[] emojis = {"", "🥇", "🥈", "🥉"};

        Notification notification = Notification.builder()
                .user(seller)
                .type(NotificationType.RANKING_ACHIEVEMENT)
                .title(emojis[position] + " ¡Top " + position + " alcanzado!")
                .message("¡Felicidades! Has alcanzado el " + posLabels[position] + " lugar en el ranking de vendedores.")
                .referenceId((long) position)
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notified seller {} about reaching ranking position #{}", seller.getFullName(), position);
    }

    @Transactional
    public void notifyAdminsFiadoCreated(Fiado fiado) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        String sellerName = fiado.getSeller().getFullName();

        for (User admin : admins) {
            Notification notification = Notification.builder()
                    .user(admin)
                    .type(NotificationType.FIADO_CREATED)
                    .title("Nuevo fiado creado")
                    .message("El vendedor " + sellerName + " registró un fiado: \"" + fiado.getItemName() + "\" por $" + fiado.getPrice().toPlainString())
                    .referenceId(fiado.getId())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        }

        log.info("Notified {} admins about new fiado {} by seller {}", admins.size(), fiado.getId(), sellerName);
    }

    @Transactional
    public void generatePendingSaleReminders() {
        log.info("Generating pending sale reminders...");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.minusHours(24);
        List<Sale> pendingSales = saleRepository.findByStatus(SaleStatus.PENDING);
        List<User> admins = userRepository.findByRole(Role.ADMIN);

        int created = 0;
        int reactivated = 0;
        int emailsSent = 0;
        int adminNotifications = 0;

        for (Sale sale : pendingSales) {
            if (sale.getOrderDate().isAfter(threshold)) {
                continue; // Skip sales less than 24h old
            }

            long daysPending = ChronoUnit.DAYS.between(sale.getOrderDate(), now);
            String orderNum = sale.getOrderNumber() != null ? sale.getOrderNumber() : "#" + sale.getId();
            String customerName = sale.getCustomerName() != null ? sale.getCustomerName() : "Sin nombre";

            // === SELLER NOTIFICATION (in-app) ===
            UUID sellerId = sale.getSeller().getId();
            Optional<Notification> existing = notificationRepository
                    .findByUserIdAndReferenceIdAndType(sellerId, sale.getId(), NotificationType.SALE_PENDING_REMINDER);

            Notification sellerNotification;
            if (existing.isPresent()) {
                sellerNotification = existing.get();
                if (sellerNotification.isRead()) {
                    sellerNotification.setRead(false);
                    notificationRepository.save(sellerNotification);
                    reactivated++;
                }
            } else {
                sellerNotification = Notification.builder()
                        .user(sale.getSeller())
                        .type(NotificationType.SALE_PENDING_REMINDER)
                        .title("Venta pendiente de pago")
                        .message("Venta " + orderNum + " - " + customerName)
                        .referenceId(sale.getId())
                        .referenceDate(sale.getOrderDate())
                        .read(false)
                        .build();
                sellerNotification = notificationRepository.save(sellerNotification);
                created++;
            }

            // === SELLER EMAIL (every 10 days) ===
            if (daysPending >= 10 && shouldSendEmail(sellerNotification, now)) {
                try {
                    emailService.sendPendingSaleReminderToSeller(
                            sale.getSeller().getEmail(),
                            sale.getSeller().getFullName(),
                            orderNum,
                            customerName,
                            sale.getTotal().toPlainString(),
                            daysPending);
                    sellerNotification.setLastEmailSentAt(now);
                    notificationRepository.save(sellerNotification);
                    emailsSent++;
                } catch (Exception e) {
                    log.error("Error sending seller email for sale {}: {}", sale.getId(), e.getMessage());
                }
            }

            // === ADMIN NOTIFICATION + EMAIL (at 30+ days) ===
            if (daysPending >= 30) {
                for (User admin : admins) {
                    Optional<Notification> adminExisting = notificationRepository
                            .findByUserIdAndReferenceIdAndType(admin.getId(), sale.getId(), NotificationType.SALE_PENDING_ADMIN_ALERT);

                    Notification adminNotification;
                    if (adminExisting.isPresent()) {
                        adminNotification = adminExisting.get();
                        if (adminNotification.isRead()) {
                            adminNotification.setRead(false);
                            notificationRepository.save(adminNotification);
                        }
                    } else {
                        adminNotification = Notification.builder()
                                .user(admin)
                                .type(NotificationType.SALE_PENDING_ADMIN_ALERT)
                                .title("Venta sin pagar - " + daysPending + " dias")
                                .message("Venta " + orderNum + " - " + customerName + " (Vendedor: " + sale.getSeller().getFullName() + ")")
                                .referenceId(sale.getId())
                                .referenceDate(sale.getOrderDate())
                                .read(false)
                                .build();
                        adminNotification = notificationRepository.save(adminNotification);
                        adminNotifications++;
                    }

                    // Admin email every 10 days
                    if (shouldSendEmail(adminNotification, now)) {
                        try {
                            emailService.sendPendingSaleAlertToAdmin(
                                    admin.getEmail(),
                                    sale.getSeller().getFullName(),
                                    sale.getSeller().getEmail(),
                                    orderNum,
                                    customerName,
                                    sale.getTotal().toPlainString(),
                                    daysPending);
                            adminNotification.setLastEmailSentAt(now);
                            notificationRepository.save(adminNotification);
                            emailsSent++;
                        } catch (Exception e) {
                            log.error("Error sending admin email for sale {}: {}", sale.getId(), e.getMessage());
                        }
                    }
                }
            }
        }

        cleanOrphanedNotifications();

        log.info("Pending sale reminders: {} created, {} reactivated, {} emails sent, {} admin notifications",
                created, reactivated, emailsSent, adminNotifications);
    }

    private boolean shouldSendEmail(Notification notification, LocalDateTime now) {
        if (notification.getLastEmailSentAt() == null) {
            return true;
        }
        long daysSinceLastEmail = ChronoUnit.DAYS.between(notification.getLastEmailSentAt(), now);
        return daysSinceLastEmail >= 10;
    }

    private void cleanOrphanedNotifications() {
        List<NotificationType> allTypes = List.of(
                NotificationType.SALE_PENDING_REMINDER,
                NotificationType.SALE_PENDING_ADMIN_ALERT,
                NotificationType.SALE_UNDER_REVIEW);

        List<NotificationType> pendingTypes = List.of(
                NotificationType.SALE_PENDING_REMINDER,
                NotificationType.SALE_PENDING_ADMIN_ALERT);

        int deletedOrphans = notificationRepository.deleteOrphanedByDeletedSales(allTypes);
        int deletedStaleReminders = notificationRepository.deleteStaleRemindersForNonPendingSales(pendingTypes);
        int deletedStaleReviews = notificationRepository.deleteStaleReviewNotifications(NotificationType.SALE_UNDER_REVIEW);

        int total = deletedOrphans + deletedStaleReminders + deletedStaleReviews;
        if (total > 0) {
            log.info("Cleaned {} orphaned notifications (orphans: {}, stale reminders: {}, stale reviews: {})",
                    total, deletedOrphans, deletedStaleReminders, deletedStaleReviews);
        }
    }

    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .referenceDate(notification.getReferenceDate())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
