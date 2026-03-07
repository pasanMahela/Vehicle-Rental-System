package com.vehiclerental.maintenance_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Component
@Slf4j
public class VehicleClient {

    private final WebClient webClient;
    private final RequestAuthHeaderProvider authHeaderProvider;

    public VehicleClient(@Value("${vehicle.service.url}") String vehicleServiceUrl,
                         RequestAuthHeaderProvider authHeaderProvider) {
        log.info("Initializing VehicleClient with URL: {}", vehicleServiceUrl);
        this.webClient = WebClient.builder()
                .baseUrl(vehicleServiceUrl)
                .build();
        this.authHeaderProvider = authHeaderProvider;
    }

    public boolean vehicleExists(String vehicleId) {
        try {
            String authorization = authHeaderProvider.getAuthorizationHeader();
            log.debug("Checking vehicle existence for {} with auth: {}", vehicleId, authorization != null ? "present" : "missing");

            webClient.get()
                    .uri("/api/vehicles/{id}", vehicleId)
                    .headers(headers -> {
                        if (authorization != null && !authorization.isBlank()) {
                            headers.set(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    })
                    .retrieve()
                    .toEntity(Object.class)
                    .block();
            log.info("Vehicle {} exists", vehicleId);
            return true;
        } catch (WebClientResponseException.NotFound e) {
            log.warn("Vehicle {} not found (404)", vehicleId);
            return false;
        } catch (WebClientResponseException e) {
            log.error("HTTP error checking vehicle {}: {} - {}", vehicleId, e.getStatusCode(), e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Error checking vehicle existence for {}: {}", vehicleId, e.getMessage(), e);
            return false;
        }
    }

    public void updateVehicleStatus(String vehicleId, String status) {
        try {
            String authorization = authHeaderProvider.getAuthorizationHeader();

            webClient.put()
                    .uri("/api/vehicles/{id}/status", vehicleId)
                    .headers(headers -> {
                        if (authorization != null && !authorization.isBlank()) {
                            headers.set(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    })
                    .bodyValue(Map.of("status", status))
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();
            log.info("Vehicle {} status updated to {}", vehicleId, status);
        } catch (Exception e) {
            log.error("Failed to update vehicle status: {} - {}", vehicleId, e.getMessage());
            throw new RuntimeException("Failed to update vehicle status for vehicle " + vehicleId, e);
        }
    }
}
