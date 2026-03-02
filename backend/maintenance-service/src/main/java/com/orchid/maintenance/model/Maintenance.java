package com.orchid.maintenance.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "maintenance_records")
public class Maintenance {
    @Id
    private String maintenanceId;

    private String vehicleId;

    private String bookingId;

    private String customerId;

    private LocalDateTime inspectionDate;

    private String description;

    private boolean hasDamage;

    private MaintenanceStatus status;

    public enum MaintenanceStatus {
        IN_PROGRESS, COMPLETED
    }
}
