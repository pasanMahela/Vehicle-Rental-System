package com.orchid.vehicle.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class NotificationClient {

    private final WebClient webClient;

    public NotificationClient(@Value("${notification.service.url:http://notification-service:8086}") String notificationServiceUrl) {
        log.info("Initializing NotificationClient with URL: {}", notificationServiceUrl);
        this.webClient = WebClient.builder()
                .baseUrl(notificationServiceUrl)
                .build();
    }

    public void sendSystemNotification(String message, String type) {
        try {
            Map<String, String> request = new HashMap<>();
            // Target the specific AdminD user that was created
            request.put("userId", "AdminD"); 
            request.put("email", "dinith.gsw@gmail.com");
            request.put("message", message);
            request.put("notificationType", type);

            log.info("Sending notification: {} - {}", type, message);

            webClient.post()
                    .uri("/api/notifications/send")
                    .header("X-User-Role", "OWNER")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();
            log.info("Successfully sent notification.");
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("Failed to send notification. Response: {}", e.getResponseBodyAsString());
            e.printStackTrace();
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            e.printStackTrace();
        }
    }
}