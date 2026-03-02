package com.orchid.notification.service;

import com.orchid.notification.dto.NotificationDTO;
import com.orchid.notification.model.Notification;
import com.orchid.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public Notification sendNotification(NotificationDTO dto) {
        Notification notification = new Notification();
        notification.setUserId(dto.getUserId());
        notification.setEmail(dto.getEmail());
        notification.setMessage(dto.getMessage());
        notification.setNotificationType(
                Notification.NotificationType.valueOf(dto.getNotificationType()));
        notification.setSentDate(LocalDateTime.now());

        boolean emailSent = false;
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            String subject = formatSubject(dto.getNotificationType());
            emailSent = emailService.sendEmail(dto.getEmail(), subject, dto.getMessage());
        }

        notification.setStatus(emailSent
                ? Notification.NotificationStatus.SENT
                : Notification.NotificationStatus.FAILED);

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created: {} for user: {}", saved.getNotificationId(), dto.getUserId());
        return saved;
    }

    public List<Notification> getNotificationsByUserId(String userId) {
        return notificationRepository.findByUserIdOrderBySentDateDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public Notification markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderBySentDateDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private String formatSubject(String type) {
        return switch (type) {
            case "BOOKING_CONFIRMATION" -> "Booking Confirmed - Orchid Vehicle Rental";
            case "BOOKING_CANCELLATION" -> "Booking Cancelled - Orchid Vehicle Rental";
            case "PAYMENT_SUCCESS" -> "Payment Successful - Orchid Vehicle Rental";
            case "PAYMENT_FAILURE" -> "Payment Failed - Orchid Vehicle Rental";
            case "MAINTENANCE_ALERT" -> "Maintenance Alert - Orchid Vehicle Rental";
            case "DAMAGE_CHARGE" -> "Damage Charge Notice - Orchid Vehicle Rental";
            case "BOOKING_REMINDER" -> "Booking Reminder - Orchid Vehicle Rental";
            default -> "Notification - Orchid Vehicle Rental";
        };
    }
}
