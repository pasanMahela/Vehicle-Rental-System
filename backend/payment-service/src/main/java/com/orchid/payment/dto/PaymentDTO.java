package com.orchid.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private String paymentId;

    @NotBlank(message = "Booking ID is required")
    private String bookingId;

    private String customerId;

    @Positive(message = "Amount must be positive")
    private double amount;

    private String paymentStatus;

    @NotBlank(message = "Payment type is required")
    private String paymentType;

    private String customerEmail;

    private String stage;
}
