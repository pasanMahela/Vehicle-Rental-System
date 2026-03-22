package com.orchid.vehicle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {
    private String vehicleId;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "Type is required")
    private String type;

    @Positive(message = "Price per day must be positive")
    private double pricePerDay;

    private double advanceDeposit;

    private String availabilityStatus;

    private String imageUrl;
}
