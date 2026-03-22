package com.orchid.payment.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
public class BookingClient {

    private final WebClient webClient;
    private final RequestAuthHeaderProvider authHeaderProvider;

    public BookingClient(@Value("${booking.service.url}") String bookingServiceUrl,
                         RequestAuthHeaderProvider authHeaderProvider) {
        this.webClient = WebClient.builder()
                .baseUrl(bookingServiceUrl)
                .build();
        this.authHeaderProvider = authHeaderProvider;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getBookingById(String bookingId) {
        try {
            String authorization = authHeaderProvider.getAuthorizationHeader();
            return webClient.get()
                    .uri("/api/bookings/{id}", bookingId)
                    .headers(headers -> setAuthorization(headers, authorization))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to get booking: {} - {}", bookingId, e.getMessage());
            throw new RuntimeException("Failed to get booking details: " + e.getMessage());
        }
    }

    private void setAuthorization(HttpHeaders headers, String authorization) {
        if (authorization != null && !authorization.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
        }
    }
}
