package com.orchid.vehicle.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.Map;

@Component
@Slf4j
public class BookingClient {

    private final WebClient webClient;

    public BookingClient(@Value("${booking.service.url}") String bookingServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(bookingServiceUrl)
                .build();
    }

    public Map<String, Long> getBookingCountsByVehicle() {
        try {
            return webClient.get()
                    .uri("/api/bookings/vehicle-counts")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Long>>() {})
                    .block();
        } catch (Exception e) {
            log.error("Failed to get booking counts from booking-service: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
