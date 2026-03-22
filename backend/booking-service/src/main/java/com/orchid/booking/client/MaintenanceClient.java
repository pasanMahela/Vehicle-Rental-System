package com.orchid.booking.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
public class MaintenanceClient {

    private final WebClient webClient;
   private final RequestAuthHeaderProvider authHeaderProvider;

   public MaintenanceClient(@Value("${maintenance.service.url}") String maintenanceServiceUrl,
                            RequestAuthHeaderProvider authHeaderProvider) {
        this.webClient = WebClient.builder()
                .baseUrl(maintenanceServiceUrl)
                .build();
       this.authHeaderProvider = authHeaderProvider;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> createInspection(String vehicleId, String bookingId, String customerId) {
        try {
            Map<String, Object> inspectionRequest = Map.of(
                    "vehicleId", vehicleId,
                    "bookingId", bookingId,
                    "customerId", customerId
            );
            return webClient.post()
                   .uri("/api/maintenance/issues/report")
                   .headers(headers -> {
                       String authorization = authHeaderProvider.getAuthorizationHeader();
                       if (authorization != null && !authorization.isBlank()) {
                           headers.set("Authorization", authorization);
                       }
                   })
                    .bodyValue(inspectionRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to create inspection for vehicle: {} - {}", vehicleId, e.getMessage());
            throw new RuntimeException("Failed to trigger inspection: " + e.getMessage());
        }
    }
}
