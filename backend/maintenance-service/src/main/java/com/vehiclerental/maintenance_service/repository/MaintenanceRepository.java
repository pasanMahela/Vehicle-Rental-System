package com.vehiclerental.maintenance_service.repository;

import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface MaintenanceRepository extends MongoRepository<MaintenanceRecord, String> {
    List<MaintenanceRecord> findByVehicleId(String vehicleId);
    
    List<MaintenanceRecord> findByVehicleIdAndStatus(String vehicleId, String status);
    
    List<MaintenanceRecord> findByStatus(String status);
    
    List<MaintenanceRecord> findByIsRecurringTrueAndNextDueDateBefore(LocalDate date);
    
    @Query("{ 'vehicleId': ?0, 'status': { $in: ['SCHEDULED', 'IN_PROGRESS'] } }")
    List<MaintenanceRecord> findUpcomingByVehicleId(String vehicleId);
    
    @Query("{ 'status': 'COMPLETED' }")
    List<MaintenanceRecord> findAllCompleted();
    
    List<MaintenanceRecord> findByIssueId(String issueId);
}