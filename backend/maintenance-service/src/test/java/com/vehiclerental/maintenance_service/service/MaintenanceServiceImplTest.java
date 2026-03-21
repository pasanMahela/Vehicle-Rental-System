package com.vehiclerental.maintenance_service.service;

import com.vehiclerental.maintenance_service.client.AuthClient;
import com.vehiclerental.maintenance_service.client.NotificationClient;
import com.vehiclerental.maintenance_service.client.VehicleClient;
import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import com.vehiclerental.maintenance_service.repository.MaintenanceRepository;
import com.vehiclerental.maintenance_service.repository.ReportedIssueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceImplTest {

    @Mock
    private MaintenanceRepository maintenanceRepository;

    @Mock
    private ReportedIssueRepository issueRepository;

    @Mock
    private VehicleClient vehicleClient;

    @Mock
    private NotificationClient notificationClient;

    @Mock
    private AuthClient authClient;

    @InjectMocks
    private MaintenanceServiceImpl service;

    @Test
    void reportIssue_throwsWhenVehicleDoesNotExist() {
        ReportedIssue issue = new ReportedIssue();
        issue.setVehicleId("vehicle-404");

        when(vehicleClient.vehicleExists("vehicle-404")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.reportIssue(issue, "user-1", "CUSTOMER", "jane"));

        assertEquals("Vehicle not found with id: vehicle-404", ex.getMessage());
        verify(issueRepository, never()).save(any());
    }

    @Test
    void reportIssue_savesIssueAndSendsNotification() {
        ReportedIssue issue = new ReportedIssue();
        issue.setVehicleId("vehicle-1");
        issue.setIssueType("ENGINE");
        issue.setDescription("Engine making unusual noise");

        AuthClient.UserInfo userInfo = new AuthClient.UserInfo();
        userInfo.setEmail("user@example.com");

        ReportedIssue saved = new ReportedIssue();
        saved.setId("issue-1");
        saved.setVehicleId("vehicle-1");

        when(vehicleClient.vehicleExists("vehicle-1")).thenReturn(true);
        when(authClient.getUserById("user-1")).thenReturn(userInfo);
        when(issueRepository.save(any(ReportedIssue.class))).thenReturn(saved);

        ReportedIssue result = service.reportIssue(issue, "user-1", "CUSTOMER", "jane");

        assertEquals("issue-1", result.getId());
        assertEquals("REPORTED", issue.getStatus());
        assertEquals("jane", issue.getReportedBy());
        assertEquals("user@example.com", issue.getReportedByEmail());
        assertNotNull(issue.getReportedDate());
        verify(notificationClient).sendNotification(eq("user-1"), eq("user@example.com"), any(String.class), eq("ISSUE_REPORTED"));
    }

    @Test
    void scheduleMaintenanceFromIssue_createsMaintenanceAndLinksIssue() {
        ReportedIssue issue = new ReportedIssue();
        issue.setId("issue-1");
        issue.setVehicleId("vehicle-1");
        issue.setIssueType("BRAKE");
        issue.setDescription("Brake pads worn");

        MaintenanceRecord saved = new MaintenanceRecord();
        saved.setId("maint-1");
        saved.setVehicleId("vehicle-1");

        when(issueRepository.findById("issue-1")).thenReturn(Optional.of(issue));
        when(maintenanceRepository.save(any(MaintenanceRecord.class))).thenReturn(saved);

        LocalDateTime scheduledDate = LocalDateTime.now().plusDays(1);
        MaintenanceRecord result = service.scheduleMaintenanceFromIssue("issue-1", scheduledDate, 2500.0);

        assertEquals("maint-1", result.getId());
        assertEquals("SCHEDULED", issue.getStatus());
        assertEquals("maint-1", issue.getMaintenanceRecordId());
        verify(vehicleClient).updateVehicleStatus("vehicle-1", "MAINTENANCE");
        verify(issueRepository, times(1)).save(issue);
    }

    @Test
    void completeMaintenance_withRecurringRecord_generatesNextRecordAndResolvesIssue() {
        MaintenanceRecord existing = new MaintenanceRecord();
        existing.setId("maint-1");
        existing.setVehicleId("vehicle-1");
        existing.setIssueId("issue-1");
        existing.setIsRecurring(true);
        existing.setRecurrencePattern("MONTHLY");
        existing.setMaintenanceType("SERVICE");
        existing.setDescription("Monthly service");
        existing.setEstimatedCost(2000.0);

        ReportedIssue linkedIssue = new ReportedIssue();
        linkedIssue.setId("issue-1");

        when(maintenanceRepository.findById("maint-1")).thenReturn(Optional.of(existing));
        when(maintenanceRepository.save(any(MaintenanceRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(issueRepository.findById("issue-1")).thenReturn(Optional.of(linkedIssue));

        MaintenanceRecord completed = service.completeMaintenance("maint-1", 2200.0);

        assertEquals("COMPLETED", completed.getStatus());
        assertEquals(2200.0, completed.getActualCost());
        assertNotNull(completed.getCompletionDate());

        ArgumentCaptor<MaintenanceRecord> saveCaptor = ArgumentCaptor.forClass(MaintenanceRecord.class);
        verify(maintenanceRepository, times(2)).save(saveCaptor.capture());
        MaintenanceRecord generatedRecord = saveCaptor.getAllValues().get(1);

        assertEquals("SCHEDULED", generatedRecord.getStatus());
        assertEquals("MONTHLY", generatedRecord.getRecurrencePattern());
        assertNotNull(generatedRecord.getNextDueDate());
        verify(vehicleClient).updateVehicleStatus("vehicle-1", "AVAILABLE");
        verify(vehicleClient).updateVehicleStatus("vehicle-1", "MAINTENANCE");
        assertEquals("RESOLVED", linkedIssue.getStatus());
        verify(issueRepository).save(linkedIssue);
    }
}