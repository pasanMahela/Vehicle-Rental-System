package com.vehiclerental.maintenance_service.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "reported_issues")
@Data
public class ReportedIssue {
    @Id
    private String id;
    private String vehicleId;
    private String issueType;
    private String description;
    private LocalDateTime reportedDate;
    private String reportedBy;
    private String status;
    private String maintenanceRecordId;
}