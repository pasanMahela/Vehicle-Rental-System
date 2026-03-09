package com.orchid.vehicle.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vehicles")
public class Vehicle {
    @Id
    private String vehicleId;

    private String brand;

    private String model;

    private String type;

    private double pricePerDay;

    private double advanceDeposit;

    private AvailabilityStatus availabilityStatus;

    @Transient
    private int bookingCount;

    @Transient
    private int popularityRank;

    public enum AvailabilityStatus {
        AVAILABLE, BOOKED, MAINTENANCE
    }
}
