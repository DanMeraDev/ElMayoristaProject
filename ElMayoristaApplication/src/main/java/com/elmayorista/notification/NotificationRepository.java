package com.elmayorista.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndReadFalse(UUID userId);

    Optional<Notification> findByUserIdAndReferenceIdAndType(UUID userId, Long referenceId, NotificationType type);

    List<Notification> findByReferenceIdAndType(Long referenceId, NotificationType type);

    List<Notification> findByReferenceIdAndTypeIn(Long referenceId, List<NotificationType> types);

    void deleteByReferenceIdAndType(Long referenceId, NotificationType type);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllReadByUserId(@Param("userId") UUID userId);
}
