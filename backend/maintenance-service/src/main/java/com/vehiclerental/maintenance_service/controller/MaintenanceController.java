package com.vehiclerental.maintenance_service.controller;

import com.vehiclerental.maintenance_service.config.RoleAccessConfig;
import com.vehiclerental.maintenance_service.dto.UpdateMaintenanceStatusRequest;
import com.vehiclerental.maintenance_service.dto.CompleteMaintenanceRequest;
import com.vehiclerental.maintenance_service.dto.ScheduleFromIssueRequest;
import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import com.vehiclerental.maintenance_service.service.MaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin
@Tag(name = "Maintenance Service", description = "API for maintenance and issue management")
public class MaintenanceController {
    
    private final MaintenanceService service;
    private final RoleAccessConfig accessConfig;

    public MaintenanceController(MaintenanceService service, RoleAccessConfig accessConfig) {
        this.service = service;
        this.accessConfig = accessConfig;
    }

    // ========== Issue Reporting Endpoints ==========
    
    @PostMapping("/issues/report")
    @Operation(summary = "Report a vehicle issue", description = "Creates a new maintenance issue report for a vehicle. Email notification is automatically sent.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Issue reported successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input or vehicle not found"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ReportedIssue reportIssue(@RequestBody ReportedIssue issue,
                                      @RequestHeader(value = "X-User-Id", required = false) String userId,
                                      @RequestHeader(value = "X-User-Role", required = false) String role,
                                      @RequestHeader(value = "X-Username", required = false) String username) {
        validateRole(role, accessConfig.getIssueReportRoles(), "Issue reporting");
        return service.reportIssue(issue, userId, role, username);
    }

    @GetMapping("/issues/vehicle/{vehicleId}")
    @Operation(summary = "Get issues for a vehicle", description = "Retrieves all maintenance issues reported for a specific vehicle")
    @ApiResponse(responseCode = "200", description = "List of issues retrieved")
    public List<ReportedIssue> getVehicleIssues(@PathVariable String vehicleId) {
        return service.getVehicleIssues(vehicleId);
    }

    @GetMapping("/issues/{issueId}")
    @Operation(summary = "Get issue details", description = "Retrieves detailed information about a specific maintenance issue")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Issue details retrieved"),
        @ApiResponse(responseCode = "404", description = "Issue not found")
    })
    public ReportedIssue getIssueById(@PathVariable String issueId) {
        return service.getIssueById(issueId);
    }

    // ========== Schedule Maintenance from Issue ==========

    @PostMapping("/schedule-from-issue/{issueId}")
    @Operation(summary = "Schedule maintenance from issue", description = "Creates a maintenance record from a reported issue")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance scheduled"),
        @ApiResponse(responseCode = "404", description = "Issue not found"),
        @ApiResponse(responseCode = "403", description = "Access denied - only REPAIR_ADVISOR")
    })
    public MaintenanceRecord scheduleFromIssue(
            @PathVariable String issueId,
            @RequestBody ScheduleFromIssueRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceScheduleRoles(), "Schedule maintenance");
        return service.scheduleMaintenanceFromIssue(issueId, request.getScheduledDate(), request.getEstimatedCost());
    }

    // ========== Scheduled/Recurring Maintenance ==========
    
    @PostMapping("/scheduled")
    @Operation(summary = "Create scheduled maintenance", description = "Creates a new maintenance schedule")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Maintenance scheduled"),
        @ApiResponse(responseCode = "400", description = "Invalid input"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public MaintenanceRecord createScheduledMaintenance(@RequestBody MaintenanceRecord record,
                                                         @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceScheduleRoles(), "Schedule maintenance");
        return service.createScheduledMaintenance(record);
    }

    @GetMapping("/upcoming/vehicle/{vehicleId}")
    @Operation(summary = "Get upcoming maintenance", description = "Retrieves scheduled maintenance for a vehicle")
    @ApiResponse(responseCode = "200", description = "List of upcoming maintenance")
    public List<MaintenanceRecord> getUpcomingMaintenance(@PathVariable String vehicleId) {
        return service.getUpcomingMaintenance(vehicleId);
    }

    @GetMapping("/upcoming/all")
    @Operation(summary = "Get all upcoming maintenance", description = "Retrieves all upcoming maintenance across all vehicles")
    @ApiResponse(responseCode = "200", description = "List of all upcoming maintenance")
    public List<MaintenanceRecord> getAllUpcomingMaintenance() {
        return service.getAllUpcomingMaintenance();
    }

    // ========== Maintenance Operations ==========
    
    @PutMapping("/{id}/start")
    @Operation(summary = "Start maintenance", description = "Marks maintenance as in progress")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance started"),
        @ApiResponse(responseCode = "404", description = "Record not found"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public MaintenanceRecord startMaintenance(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Start maintenance");
        return service.startMaintenance(id);
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Complete maintenance", description = "Marks maintenance as completed and records actual cost")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance completed"),
        @ApiResponse(responseCode = "404", description = "Record not found"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public MaintenanceRecord completeMaintenance(
            @PathVariable String id,
            @RequestBody CompleteMaintenanceRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getMaintenanceManageRoles(), "Complete maintenance");
        return service.completeMaintenance(id, request.getActualCost());
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update maintenance status", description = "Updates status of a maintenance record")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status updated"),
        @ApiResponse(responseCode = "404", description = "Record not found"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
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