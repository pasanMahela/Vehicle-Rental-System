package com.orchid.booking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {
    @Id
    private String bookingId;

    private String vehicleId;

    private String customerId;

    private String customerEmail;

    private LocalDate startDate;

    private LocalDate endDate;

    private double totalAmount;

    private double advancePaid;

    private double remainingBalance;

    private boolean finalPaymentDone;

    private BookingStatus status;

    public enum BookingStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED
    }
}
