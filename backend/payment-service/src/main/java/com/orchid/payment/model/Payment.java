package com.orchid.payment.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {
    @Id
    private String paymentId;

    private String bookingId;

    private String customerId;

    private double amount;

    private PaymentStatus paymentStatus;

    private LocalDateTime paymentDate;

    private PaymentType paymentType;

    private String stripePaymentIntentId;

    private String stage;

    public enum PaymentStatus {
        SUCCESS, FAILED, REFUNDED, PENDING
    }

    public enum PaymentType {
        ADVANCE_DEPOSIT, RENTAL_BALANCE, DAMAGE, REFUND
    }
}
