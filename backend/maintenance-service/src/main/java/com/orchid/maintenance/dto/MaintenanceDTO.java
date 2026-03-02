package com.orchid.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceDTO {
    private String maintenanceId;

    @NotBlank(message = "Vehicle ID is required")
    private String vehicleId;

    private String bookingId;

    private String customerId;

    private String description;

    private boolean hasDamage;

    private String status;
}
