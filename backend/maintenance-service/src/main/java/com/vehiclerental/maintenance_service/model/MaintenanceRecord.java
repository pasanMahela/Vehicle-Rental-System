package com.vehiclerental.maintenance_service.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "maintenance_records")
@Data
public class MaintenanceRecord {
    @Id
    private String id;
    private String vehicleId;
    private String maintenanceType; // SCHEDULED, REPAIR, ACCIDENT, BREAKDOWN
    private String description;
    
    // For scheduled/repetitive maintenance
    private Boolean isRecurring = false;
    private String recurrencePattern; // MONTHLY, QUARTERLY, YEARLY
    private LocalDate nextDueDate;
    
    // For issue-based maintenance
    private String issueId; // Link to reported issue if applicable
    
    // Cost tracking
    private Double estimatedCost;
    private Double actualCost;
    
    // Status tracking
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    private LocalDateTime scheduledDate;
    private LocalDateTime startDate;
    private LocalDateTime completionDate;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}