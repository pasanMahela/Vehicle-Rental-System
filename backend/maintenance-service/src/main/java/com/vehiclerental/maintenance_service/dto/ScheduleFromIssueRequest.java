package com.vehiclerental.maintenance_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScheduleFromIssueRequest {
    private LocalDateTime scheduledDate;
    private Double estimatedCost;
}