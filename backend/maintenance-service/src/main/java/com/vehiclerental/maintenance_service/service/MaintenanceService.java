package com.vehiclerental.maintenance_service.service;

import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


public interface MaintenanceService {
    // Issue reporting
    ReportedIssue reportIssue(ReportedIssue issue, String userId, String role, String username);
    List<ReportedIssue> getVehicleIssues(String vehicleId);
    ReportedIssue getIssueById(String issueId);
    
    // Schedule maintenance from issue
    MaintenanceRecord scheduleMaintenanceFromIssue(String issueId, LocalDateTime scheduledDate, Double estimatedCost);
    
    // Scheduled/Recurring maintenance
    MaintenanceRecord createScheduledMaintenance(MaintenanceRecord record);
    List<MaintenanceRecord> getUpcomingMaintenance(String vehicleId);
    List<MaintenanceRecord> getAllUpcomingMaintenance();
    
    // Maintenance operations
    MaintenanceRecord startMaintenance(String id);
    MaintenanceRecord completeMaintenance(String id, Double actualCost);
    MaintenanceRecord updateMaintenanceStatus(String id, String status);
    
    // History and queries
    List<MaintenanceRecord> getVehicleMaintenanceHistory(String vehicleId);
    List<MaintenanceRecord> getAllMaintenanceHistory();
    List<MaintenanceRecord> getVehicleCompletedMaintenance(String vehicleId);
    
    // Recurring maintenance handling
    void generateRecurringMaintenance();
    
    // Delete
    void deleteMaintenanceRecord(String id);
    void deleteIssue(String id);
}