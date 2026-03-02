package com.orchid.maintenance.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
public class PaymentClient {

    private final WebClient webClient;

    public PaymentClient(@Value("${payment.service.url}") String paymentServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(paymentServiceUrl)
                .build();
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
            return webClient.post()
                    .uri("/api/payments")
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
