package com.vehiclerental.maintenance_service.controller;

import com.vehiclerental.maintenance_service.dto.UpdateMaintenanceStatusRequest;
import com.vehiclerental.maintenance_service.dto.CompleteMaintenanceRequest;
import com.vehiclerental.maintenance_service.dto.ScheduleFromIssueRequest;
import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import com.vehiclerental.maintenance_service.service.MaintenanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin
public class MaintenanceController {

    private final MaintenanceService service;

    public MaintenanceController(MaintenanceService service) {
        this.service = service;
    }

    // ========== Issue Reporting Endpoints ==========
    
    @PostMapping("/issues/report")
    public ReportedIssue reportIssue(@RequestBody ReportedIssue issue) {
        return service.reportIssue(issue);
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
            @RequestBody ScheduleFromIssueRequest request) {
        return service.scheduleMaintenanceFromIssue(issueId, request.getScheduledDate(), request.getEstimatedCost());
    }

    // ========== Scheduled/Recurring Maintenance ==========
    
    @PostMapping("/scheduled")
    public MaintenanceRecord createScheduledMaintenance(@RequestBody MaintenanceRecord record) {
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
    public MaintenanceRecord startMaintenance(@PathVariable String id) {
        return service.startMaintenance(id);
    }

    @PutMapping("/{id}/complete")
    public MaintenanceRecord completeMaintenance(
            @PathVariable String id,
            @RequestBody CompleteMaintenanceRequest request) {
        return service.completeMaintenance(id, request.getActualCost());
    }

    @PutMapping("/{id}/status")
    public MaintenanceRecord updateStatus(
            @PathVariable String id,
            @RequestBody UpdateMaintenanceStatusRequest request) {
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
    public String generateRecurringMaintenance() {
        service.generateRecurringMaintenance();
        return "Recurring maintenance records generated successfully";
    }

    // ========== Delete Endpoints ==========
    
    @DeleteMapping("/records/{id}")
    public String deleteMaintenanceRecord(@PathVariable String id) {
        service.deleteMaintenanceRecord(id);
        return "Maintenance record deleted successfully";
    }

    @DeleteMapping("/issues/{id}")
    public String deleteIssue(@PathVariable String id) {
        service.deleteIssue(id);
        return "Issue deleted successfully";
    }
}