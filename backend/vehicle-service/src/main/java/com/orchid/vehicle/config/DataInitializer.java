package com.orchid.vehicle.config;

import com.orchid.vehicle.model.SystemSettings;
import com.orchid.vehicle.model.Vehicle;
import com.orchid.vehicle.repository.SettingsRepository;
import com.orchid.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final VehicleRepository vehicleRepository;
    private final SettingsRepository settingsRepository;

    @Override
    public void run(String... args) {
        if (settingsRepository.count() == 0) {
            SystemSettings settings = new SystemSettings();
            settings.setAdvanceDepositByType(Map.of(
                    "SEDAN", 5000.0, "SUV", 8000.0, "VAN", 10000.0,
                    "ELECTRIC", 12000.0, "TRUCK", 7000.0, "MOTORCYCLE", 3000.0
            ));
            settingsRepository.save(settings);
            log.info("Seeded system settings with default advance deposits");
        }

        List<Vehicle> canonicalVehicles = List.of(
                vehicle("VEH001", "Toyota", "Corolla", "SEDAN", 4500.0, 5000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH002", "Honda", "Civic", "SEDAN", 5000.0, 5000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH003", "BMW", "3 Series", "SEDAN", 8500.0, 5000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH004", "Toyota", "RAV4", "SUV", 7000.0, 8000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH005", "Ford", "Explorer", "SUV", 8000.0, 8000.0, Vehicle.AvailabilityStatus.BOOKED),
                vehicle("VEH006", "Jeep", "Wrangler", "SUV", 9000.0, 8000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH007", "Toyota", "HiAce", "VAN", 10000.0, 10000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH008", "Ford", "Transit", "VAN", 9500.0, 10000.0, Vehicle.AvailabilityStatus.MAINTENANCE),
                vehicle("VEH009", "Tesla", "Model 3", "ELECTRIC", 11000.0, 12000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH010", "Nissan", "Leaf", "ELECTRIC", 6500.0, 12000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH011", "Toyota", "Hilux", "TRUCK", 7500.0, 7000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("VEH012", "Honda", "CB500", "MOTORCYCLE", 3000.0, 3000.0, Vehicle.AvailabilityStatus.AVAILABLE)
        );

        if (vehicleRepository.count() > 0) {
            boolean hasLegacyIds = vehicleRepository.findAll().stream()
                    .allMatch(v -> v.getVehicleId() != null && v.getVehicleId().startsWith("VEH"));

            if (hasLegacyIds) {
                log.info("Vehicles already exist with canonical IDs, skipping seed");
                return;
            }

            // Local data was previously seeded with random Mongo IDs, which breaks
            // booking/payment lookups that expect stable VEH00x identifiers.
            vehicleRepository.deleteAll();
            vehicleRepository.saveAll(canonicalVehicles);
            log.info("Replaced vehicle seed data with canonical VEH IDs");
            return;
        }

        vehicleRepository.saveAll(canonicalVehicles);
        log.info("Seeded {} sample vehicles", canonicalVehicles.size());
    }

    private Vehicle vehicle(String vehicleId, String brand, String model, String type, double price,
                            double advance, Vehicle.AvailabilityStatus status) {
        Vehicle v = new Vehicle();
        v.setVehicleId(vehicleId);
        v.setBrand(brand);
        v.setModel(model);
        v.setType(type);
        v.setPricePerDay(price);
        v.setAdvanceDeposit(advance);
        v.setAvailabilityStatus(status);
        return v;
    }
}
