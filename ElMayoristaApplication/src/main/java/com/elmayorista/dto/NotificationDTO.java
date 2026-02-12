package com.elmayorista.dto;

import com.elmayorista.notification.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private Long referenceId;
    private LocalDateTime referenceDate;
    private boolean read;
    private LocalDateTime createdAt;
}
