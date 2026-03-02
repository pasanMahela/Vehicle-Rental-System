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

        if (vehicleRepository.count() > 0) {
            log.info("Vehicles already exist, skipping seed");
            return;
        }

        List<Vehicle> vehicles = List.of(
                vehicle("Toyota", "Corolla", "SEDAN", 4500.0, 5000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Honda", "Civic", "SEDAN", 5000.0, 5000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("BMW", "3 Series", "SEDAN", 8500.0, 5000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Toyota", "RAV4", "SUV", 7000.0, 8000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Ford", "Explorer", "SUV", 8000.0, 8000.0, Vehicle.AvailabilityStatus.BOOKED),
                vehicle("Jeep", "Wrangler", "SUV", 9000.0, 8000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Toyota", "HiAce", "VAN", 10000.0, 10000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Ford", "Transit", "VAN", 9500.0, 10000.0, Vehicle.AvailabilityStatus.MAINTENANCE),
                vehicle("Tesla", "Model 3", "ELECTRIC", 11000.0, 12000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Nissan", "Leaf", "ELECTRIC", 6500.0, 12000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Toyota", "Hilux", "TRUCK", 7500.0, 7000.0, Vehicle.AvailabilityStatus.AVAILABLE),
                vehicle("Honda", "CB500", "MOTORCYCLE", 3000.0, 3000.0, Vehicle.AvailabilityStatus.AVAILABLE)
        );

        vehicleRepository.saveAll(vehicles);
        log.info("Seeded {} sample vehicles", vehicles.size());
    }

    private Vehicle vehicle(String brand, String model, String type, double price,
                            double advance, Vehicle.AvailabilityStatus status) {
        Vehicle v = new Vehicle();
        v.setBrand(brand);
        v.setModel(model);
        v.setType(type);
        v.setPricePerDay(price);
        v.setAdvanceDeposit(advance);
        v.setAvailabilityStatus(status);
        return v;
    }
}
