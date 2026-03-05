package com.vehiclerental.maintenance_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Component
@Slf4j
public class VehicleClient {

    private final WebClient webClient;

    public VehicleClient(@Value("${vehicle.service.url}") String vehicleServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(vehicleServiceUrl)
                .build();
    }

    public boolean vehicleExists(String vehicleId) {
        try {
            webClient.get()
                    .uri("/api/vehicles/{id}", vehicleId)
                    .retrieve()
                    .toEntity(Object.class)
                    .block();
            log.info("Vehicle {} exists", vehicleId);
            return true;
        } catch (WebClientResponseException.NotFound e) {
            log.warn("Vehicle {} not found (404)", vehicleId);
            return false;
        } catch (Exception e) {
            log.error("Error checking vehicle existence for {}: {}", vehicleId, e.getMessage(), e);
            return false;
        }
    }

    public void updateVehicleStatus(String vehicleId, String status) {
        try {
            webClient.put()
                    .uri("/api/vehicles/{id}/status", vehicleId)
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
