package com.orchid.maintenance.repository;

import com.orchid.maintenance.model.Maintenance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MaintenanceRepository extends MongoRepository<Maintenance, String> {
    List<Maintenance> findByVehicleIdOrderByInspectionDateDesc(String vehicleId);
    List<Maintenance> findByBookingId(String bookingId);
}
