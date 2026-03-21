package com.orchid.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

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

    @SuppressWarnings("unchecked")
    public Map<String, Object> getVehicleById(String vehicleId) {
        try {
            return webClient.get()
                    .uri("/api/vehicles/{id}", vehicleId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to get vehicle: {} - {}", vehicleId, e.getMessage());
            throw new RuntimeException("Failed to fetch vehicle details: " + e.getMessage());
        }
    }
}
