package com.orchid.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
public class VehicleClient {

    private final WebClient webClient;
    private final RequestAuthHeaderProvider authHeaderProvider;

    public VehicleClient(@Value("${vehicle.service.url}") String vehicleServiceUrl,
                         RequestAuthHeaderProvider authHeaderProvider) {
        this.webClient = WebClient.builder()
                .baseUrl(vehicleServiceUrl)
                .build();
        this.authHeaderProvider = authHeaderProvider;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getVehicleById(String vehicleId) {
        try {
            String authorization = authHeaderProvider.getAuthorizationHeader();
            return webClient.get()
                    .uri("/api/vehicles/{id}", vehicleId)
                    .headers(headers -> setAuthorization(headers, authorization))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to get vehicle: {} - {}", vehicleId, e.getMessage());
            throw new RuntimeException("Failed to fetch vehicle details: " + e.getMessage());
        }
    }

    private void setAuthorization(HttpHeaders headers, String authorization) {
        if (authorization != null && !authorization.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
        }
    }
}
