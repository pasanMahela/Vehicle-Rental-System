package com.orchid.notification.config;

import com.orchid.notification.model.Notification;
import com.orchid.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final NotificationRepository notificationRepository;

    @Override
    public void run(String... args) {
        if (notificationRepository.count() > 0) {
            log.info("Notifications already exist, skipping seed");
            return;
        }

        List<Notification> notifs = List.of(
                notif("CUST001", "customer1@gmail.com", "Your booking BOOK001 for Toyota Corolla has been confirmed.",
                        Notification.NotificationType.BOOKING_CONFIRMATION, LocalDateTime.now().minusDays(10), false),
                notif("CUST001", "customer1@gmail.com", "Payment of $225.00 received for booking BOOK001.",
                        Notification.NotificationType.PAYMENT_SUCCESS, LocalDateTime.now().minusDays(10), false),
                notif("CUST001", "customer1@gmail.com", "Damage found during inspection: Front bumper scratch. Charge: $150.00",
                        Notification.NotificationType.DAMAGE_CHARGE, LocalDateTime.now().minusDays(4), false),
                notif("CUST002", "customer2@gmail.com", "Your booking BOOK002 for BMW 3 Series has been confirmed.",
                        Notification.NotificationType.BOOKING_CONFIRMATION, LocalDateTime.now().minusDays(3), false),
                notif("CUST002", "customer2@gmail.com", "Payment of $425.00 received for booking BOOK002.",
                        Notification.NotificationType.PAYMENT_SUCCESS, LocalDateTime.now().minusDays(3), true),
                notif("CUST002", "customer2@gmail.com", "Reminder: Your booking BOOK002 ends tomorrow. Please return the vehicle on time.",
                        Notification.NotificationType.BOOKING_REMINDER, LocalDateTime.now().minusDays(1), false),
                notif("CUST003", "customer3@gmail.com", "Your booking BOOK008 has been cancelled. Refund of $135.00 processed.",
                        Notification.NotificationType.BOOKING_CANCELLATION, LocalDateTime.now().minusDays(19), true),
                notif("CUST004", "customer4@gmail.com", "Your booking BOOK005 for Honda Civic has been confirmed.",
                        Notification.NotificationType.BOOKING_CONFIRMATION, LocalDateTime.now().minusDays(2), false),
                notif("CUST004", "customer4@gmail.com", "Payment of $250.00 received for booking BOOK005.",
                        Notification.NotificationType.PAYMENT_SUCCESS, LocalDateTime.now().minusDays(2), false),
                notif("CUST005", "customer5@gmail.com", "Your booking BOOK006 for Tesla Model 3 is pending confirmation.",
                        Notification.NotificationType.BOOKING_REMINDER, LocalDateTime.now().minusHours(5), false),
                notif("CUST001", "customer1@gmail.com", "Vehicle Toyota Corolla maintenance completed. Ready for next rental.",
                        Notification.NotificationType.MAINTENANCE_ALERT, LocalDateTime.now().minusDays(3), true),
                notif("CUST002", "customer2@gmail.com", "Payment of $75.00 failed for damage charges on booking BOOK007.",
                        Notification.NotificationType.PAYMENT_FAILURE, LocalDateTime.now().minusDays(9), false)
        );

        notificationRepository.saveAll(notifs);
        log.info("Seeded {} sample notifications", notifs.size());
    }

    private Notification notif(String userId, String email, String message,
                                Notification.NotificationType type, LocalDateTime sentDate, boolean read) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setEmail(email);
        n.setMessage(message);
        n.setNotificationType(type);
        n.setSentDate(sentDate);
        n.setStatus(Notification.NotificationStatus.SENT);
        n.setRead(read);
        return n;
    }
}
