package com.vehiclerental.maintenance_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
public class NotificationClient {

    private final WebClient webClient;

    public NotificationClient(@Value("${notification.service.url}") String notificationServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(notificationServiceUrl)
                .build();
    }

    public void sendNotification(String userId, String email, String message, String type) {
        try {
            webClient.post()
                    .uri("/api/notifications/send")
                    .bodyValue(Map.of(
                            "userId", userId,
                            "email", email != null ? email : "",
                            "message", message,
                            "notificationType", type
                    ))
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();
            log.info("Notification sent for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to send notification for user: {} - {}", userId, e.getMessage());
        }
    }
}
