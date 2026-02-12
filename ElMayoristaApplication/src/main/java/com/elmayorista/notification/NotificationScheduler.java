package com.elmayorista.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationService notificationService;

    /**
     * Run daily at 8:00 AM to generate pending sale reminders.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void dailyPendingSaleReminders() {
        log.info("Running scheduled pending sale reminders...");
        notificationService.generatePendingSaleReminders();
    }

    /**
     * Run on application startup to generate any missing notifications.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Application started - generating pending sale reminders...");
        notificationService.generatePendingSaleReminders();
    }
}
