package com.orchid.vehicle.repository;

import com.orchid.vehicle.model.SystemSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SettingsRepository extends MongoRepository<SystemSettings, String> {
}
