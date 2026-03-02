package com.orchid.maintenance.repository;

import com.orchid.maintenance.model.Damage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DamageRepository extends MongoRepository<Damage, String> {
    List<Damage> findByInspectionId(String inspectionId);
    List<Damage> findByVehicleId(String vehicleId);
}
