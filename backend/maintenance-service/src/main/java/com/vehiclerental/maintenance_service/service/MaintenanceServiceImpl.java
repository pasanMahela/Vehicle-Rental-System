package com.vehiclerental.maintenance_service.service;

import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import com.vehiclerental.maintenance_service.repository.MaintenanceRepository;
import com.vehiclerental.maintenance_service.repository.ReportedIssueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final ReportedIssueRepository issueRepository;

    public MaintenanceServiceImpl(MaintenanceRepository maintenanceRepository, 
                                 ReportedIssueRepository issueRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.issueRepository = issueRepository;
    }

    @Override
    public ReportedIssue reportIssue(ReportedIssue issue) {
        issue.setReportedDate(LocalDateTime.now());
        issue.setStatus("REPORTED");
        return issueRepository.save(issue);
    }

    @Override
    public List<ReportedIssue> getVehicleIssues(String vehicleId) {
        return issueRepository.findByVehicleId(vehicleId);
    }

    @Override
    public ReportedIssue getIssueById(String issueId) {
        return issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + issueId));
    }

    @Override
    @Transactional
    public MaintenanceRecord scheduleMaintenanceFromIssue(String issueId, LocalDateTime scheduledDate, Double estimatedCost) {
        ReportedIssue issue = getIssueById(issueId);
        
        MaintenanceRecord record = new MaintenanceRecord();
        record.setVehicleId(issue.getVehicleId());
        record.setMaintenanceType(issue.getIssueType());
        record.setDescription(issue.getDescription());
        record.setIssueId(issueId);
        record.setEstimatedCost(estimatedCost);
        record.setStatus("SCHEDULED");
        record.setScheduledDate(scheduledDate);
        record.setIsRecurring(false);
        record.setCreatedAt(LocalDateTime.now());
        
        MaintenanceRecord savedRecord = maintenanceRepository.save(record);
        
        issue.setMaintenanceRecordId(savedRecord.getId());
        issue.setStatus("SCHEDULED");
        issueRepository.save(issue);
        
        return savedRecord;
    }

    @Override
    public MaintenanceRecord createScheduledMaintenance(MaintenanceRecord record) {
        record.setStatus("SCHEDULED");
        record.setIsRecurring(true);
        record.setCreatedAt(LocalDateTime.now());
        
        if (record.getNextDueDate() == null) {
            LocalDate nextDue = LocalDate.now();
            switch(record.getRecurrencePattern()) {
                case "MONTHLY":
                    nextDue = nextDue.plusMonths(1);
                    break;
                case "QUARTERLY":
                    nextDue = nextDue.plusMonths(3);
                    break;
                case "YEARLY":
                    nextDue = nextDue.plusYears(1);
                    break;
            }
            record.setNextDueDate(nextDue);
        }
        
        return maintenanceRepository.save(record);
    }

    @Override
    public List<MaintenanceRecord> getUpcomingMaintenance(String vehicleId) {
        return maintenanceRepository.findUpcomingByVehicleId(vehicleId);
    }

    @Override
    public List<MaintenanceRecord> getAllUpcomingMaintenance() {
        return maintenanceRepository.findByStatus("SCHEDULED");
    }

    @Override
    public MaintenanceRecord startMaintenance(String id) {
        MaintenanceRecord record = getMaintenanceRecord(id);
        record.setStatus("IN_PROGRESS");
        record.setStartDate(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        return maintenanceRepository.save(record);
    }

    @Override
    @Transactional
    public MaintenanceRecord completeMaintenance(String id, Double actualCost) {
        MaintenanceRecord record = getMaintenanceRecord(id);
        record.setStatus("COMPLETED");
        record.setActualCost(actualCost);
        record.setCompletionDate(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        
        MaintenanceRecord savedRecord = maintenanceRepository.save(record);
        
        if (record.getIssueId() != null) {
            ReportedIssue issue = getIssueById(record.getIssueId());
            issue.setStatus("RESOLVED");
            issueRepository.save(issue);
        }
        
        if (record.getIsRecurring()) {
            generateNextRecurringMaintenance(record);
        }
        
        return savedRecord;
    }

    @Override
    public MaintenanceRecord updateMaintenanceStatus(String id, String status) {
        MaintenanceRecord record = getMaintenanceRecord(id);
        record.setStatus(status);
        record.setUpdatedAt(LocalDateTime.now());
        
        if ("IN_PROGRESS".equals(status) && record.getStartDate() == null) {
            record.setStartDate(LocalDateTime.now());
        } else if ("COMPLETED".equals(status) && record.getCompletionDate() == null) {
            record.setCompletionDate(LocalDateTime.now());
        }
        
        return maintenanceRepository.save(record);
    }

    @Override
    public List<MaintenanceRecord> getVehicleMaintenanceHistory(String vehicleId) {
        return maintenanceRepository.findByVehicleId(vehicleId);
    }

    @Override
    public List<MaintenanceRecord> getAllMaintenanceHistory() {
        return maintenanceRepository.findAll();
    }

    @Override
    public List<MaintenanceRecord> getVehicleCompletedMaintenance(String vehicleId) {
        return maintenanceRepository.findByVehicleIdAndStatus(vehicleId, "COMPLETED");
    }

    @Override
    public void generateRecurringMaintenance() {
        List<MaintenanceRecord> dueRecords = maintenanceRepository
                .findByIsRecurringTrueAndNextDueDateBefore(LocalDate.now());
        
        for (MaintenanceRecord record : dueRecords) {
            generateNextRecurringMaintenance(record);
        }
    }

    @Override
    public void deleteMaintenanceRecord(String id) {
        maintenanceRepository.deleteById(id);
    }

    @Override
    public void deleteIssue(String id) {
        issueRepository.deleteById(id);
    }

    private MaintenanceRecord getMaintenanceRecord(String id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance record not found with id: " + id));
    }

    private void generateNextRecurringMaintenance(MaintenanceRecord completedRecord) {
        MaintenanceRecord nextRecord = new MaintenanceRecord();
        nextRecord.setVehicleId(completedRecord.getVehicleId());
        nextRecord.setMaintenanceType(completedRecord.getMaintenanceType());
        nextRecord.setDescription(completedRecord.getDescription());
        nextRecord.setIsRecurring(true);
        nextRecord.setRecurrencePattern(completedRecord.getRecurrencePattern());
        nextRecord.setEstimatedCost(completedRecord.getEstimatedCost());
        nextRecord.setStatus("SCHEDULED");
        
        LocalDate nextDue = LocalDate.now();
        switch(completedRecord.getRecurrencePattern()) {
            case "MONTHLY":
                nextDue = nextDue.plusMonths(1);
                break;
            case "QUARTERLY":
                nextDue = nextDue.plusMonths(3);
                break;
            case "YEARLY":
                nextDue = nextDue.plusYears(1);
                break;
        }
        nextRecord.setNextDueDate(nextDue);
        nextRecord.setScheduledDate(nextDue.atStartOfDay());
        nextRecord.setCreatedAt(LocalDateTime.now());
        
        maintenanceRepository.save(nextRecord);
    }
}