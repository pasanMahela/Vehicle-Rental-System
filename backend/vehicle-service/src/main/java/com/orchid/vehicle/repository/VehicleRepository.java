package com.orchid.vehicle.repository;

import com.orchid.vehicle.model.Vehicle;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VehicleRepository extends MongoRepository<Vehicle, String> {
    List<Vehicle> findByAvailabilityStatus(Vehicle.AvailabilityStatus status);
    List<Vehicle> findByType(String type);
}
