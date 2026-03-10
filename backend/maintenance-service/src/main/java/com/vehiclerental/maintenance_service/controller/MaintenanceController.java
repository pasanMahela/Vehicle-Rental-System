package com.vehiclerental.maintenance_service.controller;

import com.vehiclerental.maintenance_service.config.RoleAccessConfig;
import com.vehiclerental.maintenance_service.dto.UpdateMaintenanceStatusRequest;
import com.vehiclerental.maintenance_service.dto.CompleteMaintenanceRequest;
import com.vehiclerental.maintenance_service.dto.ScheduleFromIssueRequest;
import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import com.vehiclerental.maintenance_service.service.MaintenanceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin
public class MaintenanceController {
    
    private final MaintenanceService service;
    private final RoleAccessConfig accessConfig;

    public MaintenanceController(MaintenanceService service, RoleAccessConfig accessConfig) {
        this.service = service;
        this.accessConfig = accessConfig;
    }

    // ========== Issue Reporting Endpoints ==========
    
    @PostMapping("/issues/report")
    public ReportedIssue reportIssue(@RequestBody ReportedIssue issue,
                                      @RequestHeader(value = "X-User-Id", required = false) String userId,
                                      @RequestHeader(value = "X-User-Role", required = false) String role,
                                      @RequestHeader(value = "X-Username", required = false) String username) {
        validateRole(role, accessConfig.getIssueReportRoles(), "Issue reporting");
        return service.reportIssue(issue, userId, role, username);
    }

    @GetMapping("/issues/vehicle/{vehicleId}")
    public List<ReportedIssue> getVehicleIssues(@PathVariable String vehicleId) {
        return service.getVehicleIssues(vehicleId);
    }

    @GetMapping("/issues/{issueId}")
    public ReportedIssue getIssueById(@PathVariable String issueId) {
        return service.getIssueById(issueId);
    }

    // ========== Schedule Maintenance from Issue ==========

    @PostMapping("/schedule-from-issue/{issueId}")
    public MaintenanceRecord scheduleFromIssue(
            @PathVariable String issueId,
            @RequestBody ScheduleFromIssueRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceScheduleRoles(), "Schedule maintenance");
        return service.scheduleMaintenanceFromIssue(issueId, request.getScheduledDate(), request.getEstimatedCost());
    }

    // ========== Scheduled/Recurring Maintenance ==========
    
    @PostMapping("/scheduled")
    public MaintenanceRecord createScheduledMaintenance(@RequestBody MaintenanceRecord record,
                                                         @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceScheduleRoles(), "Schedule maintenance");
        return service.createScheduledMaintenance(record);
    }

    @GetMapping("/upcoming/vehicle/{vehicleId}")
    public List<MaintenanceRecord> getUpcomingMaintenance(@PathVariable String vehicleId) {
        return service.getUpcomingMaintenance(vehicleId);
    }

    @GetMapping("/upcoming/all")
    public List<MaintenanceRecord> getAllUpcomingMaintenance() {
        return service.getAllUpcomingMaintenance();
    }

    // ========== Maintenance Operations ==========
    
    @PutMapping("/{id}/start")
    public MaintenanceRecord startMaintenance(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Start maintenance");
        return service.startMaintenance(id);
    }

    @PutMapping("/{id}/complete")
    public MaintenanceRecord completeMaintenance(
            @PathVariable String id,
            @RequestBody CompleteMaintenanceRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Complete maintenance");
        return service.completeMaintenance(id, request.getActualCost());
    }

    @PutMapping("/{id}/status")
    public MaintenanceRecord updateStatus(
            @PathVariable String id,
            @RequestBody UpdateMaintenanceStatusRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Update maintenance status");
        return service.updateMaintenanceStatus(id, request.getStatus());
    }

    // ========== History Endpoints ==========
    
    @GetMapping("/history/vehicle/{vehicleId}")
    public List<MaintenanceRecord> getVehicleHistory(@PathVariable String vehicleId) {
        return service.getVehicleMaintenanceHistory(vehicleId);
    }

    @GetMapping("/history/all")
    public List<MaintenanceRecord> getAllHistory() {
        return service.getAllMaintenanceHistory();
    }

    @GetMapping("/history/vehicle/{vehicleId}/completed")
    public List<MaintenanceRecord> getVehicleCompleted(@PathVariable String vehicleId) {
        return service.getVehicleCompletedMaintenance(vehicleId);
    }

    // ========== Admin/Utility Endpoints ==========
    
    @PostMapping("/generate-recurring")
    public String generateRecurringMaintenance(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Generate recurring maintenance");
        service.generateRecurringMaintenance();
        return "Recurring maintenance records generated successfully";
    }

    // ========== Delete Endpoints ==========
    
    @DeleteMapping("/records/{id}")
    public String deleteMaintenanceRecord(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Delete maintenance record");
        service.deleteMaintenanceRecord(id);
        return "Maintenance record deleted successfully";
    }

    @DeleteMapping("/issues/{id}")
    public String deleteIssue(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Delete issue");
        service.deleteIssue(id);
        return "Issue deleted successfully";
    }

    private void validateRole(String userRole, List<String> allowedRoles, String operation) {
        if (userRole == null) return;
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}