package com.elmayorista.notification;

import com.elmayorista.dto.NotificationDTO;
import com.elmayorista.sale.Sale;
import com.elmayorista.sale.SaleRepository;
import com.elmayorista.sale.SaleStatus;
import com.elmayorista.service.EmailService;
import com.elmayorista.user.Role;
import com.elmayorista.user.User;
import com.elmayorista.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notificacion no encontrada"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("No tienes permiso para modificar esta notificacion");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public void clearNotificationsForSale(Long saleId) {
        List<Notification> notifications = notificationRepository
                .findByReferenceIdAndTypeIn(saleId, List.of(
                        NotificationType.SALE_PENDING_REMINDER,
                        NotificationType.SALE_PENDING_ADMIN_ALERT));
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
            log.info("Cleared {} notifications for sale {}", notifications.size(), saleId);
        }
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
        List<Notification> allReminders = notificationRepository.findAll().stream()
                .filter(n -> n.getType() == NotificationType.SALE_PENDING_REMINDER
                        || n.getType() == NotificationType.SALE_PENDING_ADMIN_ALERT)
                .collect(Collectors.toList());

        int cleaned = 0;
        for (Notification notification : allReminders) {
            if (notification.getReferenceId() != null) {
                Optional<Sale> sale = saleRepository.findById(notification.getReferenceId());
                if (sale.isEmpty() || sale.get().getStatus() != SaleStatus.PENDING) {
                    notificationRepository.delete(notification);
                    cleaned++;
                }
            }
        }

        if (cleaned > 0) {
            log.info("Cleaned {} orphaned notifications", cleaned);
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
