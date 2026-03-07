package com.vehiclerental.maintenance_service.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
public class PaymentClient {

    private final WebClient webClient;
    private final RequestAuthHeaderProvider authHeaderProvider;

    public PaymentClient(@Value("${payment.service.url}") String paymentServiceUrl,
                         RequestAuthHeaderProvider authHeaderProvider) {
        this.webClient = WebClient.builder()
                .baseUrl(paymentServiceUrl)
                .build();
        this.authHeaderProvider = authHeaderProvider;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> createDamagePayment(String bookingId, String customerId,
                                                    double amount, String customerEmail) {
        try {
            Map<String, Object> paymentRequest = Map.of(
                    "bookingId", bookingId,
                    "customerId", customerId,
                    "amount", amount,
                    "paymentType", "DAMAGE",
                    "customerEmail", customerEmail != null ? customerEmail : ""
            );

            String authorization = authHeaderProvider.getAuthorizationHeader();

            return webClient.post()
                    .uri("/api/payments")
                    .headers(headers -> {
                        if (authorization != null && !authorization.isBlank()) {
                            headers.set(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    })
                    .bodyValue(paymentRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to create damage payment for booking: {} - {}", bookingId, e.getMessage());
            throw new RuntimeException("Failed to process damage payment: " + e.getMessage());
        }
    }
}
