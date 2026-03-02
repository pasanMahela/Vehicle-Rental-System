package com.orchid.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

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

    @SuppressWarnings("unchecked")
    public Map<String, Object> getBookingById(String bookingId) {
        try {
            return webClient.get()
                    .uri("/api/bookings/{id}", bookingId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to get booking: {} - {}", bookingId, e.getMessage());
            throw new RuntimeException("Failed to get booking details: " + e.getMessage());
        }
    }
}
