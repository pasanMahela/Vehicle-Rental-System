package com.orchid.notification.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String notificationId;

    private String userId;

    private String email;

    private String message;

    private NotificationType notificationType;

    private LocalDateTime sentDate;

    private NotificationStatus status;

    private boolean read;

    private String relatedEntity;

    private String relatedEntityId;

    public enum NotificationType {
        BOOKING_CONFIRMATION,
        BOOKING_CANCELLATION,
        PAYMENT_SUCCESS,
        PAYMENT_FAILURE,
        MAINTENANCE_ALERT,
        DAMAGE_CHARGE,
        BOOKING_REMINDER
    }

    public enum NotificationStatus {
        SENT, FAILED
    }
}
