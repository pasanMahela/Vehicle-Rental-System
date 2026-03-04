package com.vehiclerental.maintenance_service.repository;

import com.vehiclerental.maintenance_service.model.ReportedIssue;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReportedIssueRepository extends MongoRepository<ReportedIssue, String> {
    List<ReportedIssue> findByVehicleId(String vehicleId);
    List<ReportedIssue> findByVehicleIdAndStatus(String vehicleId, String status);
    List<ReportedIssue> findByStatus(String status);
}