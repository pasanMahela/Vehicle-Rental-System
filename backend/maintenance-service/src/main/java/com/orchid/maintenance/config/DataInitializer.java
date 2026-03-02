package com.orchid.maintenance.config;

import com.orchid.maintenance.model.Damage;
import com.orchid.maintenance.model.Maintenance;
import com.orchid.maintenance.repository.DamageRepository;
import com.orchid.maintenance.repository.MaintenanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final MaintenanceRepository maintenanceRepository;
    private final DamageRepository damageRepository;

    @Override
    public void run(String... args) {
        if (maintenanceRepository.count() > 0) {
            log.info("Maintenance records already exist, skipping seed");
            return;
        }

        List<Maintenance> records = List.of(
                maintenance("MAINT001", "VEH001", "BOOK001", "CUST001",
                        LocalDateTime.now().minusDays(5), "Post-rental inspection for Toyota Corolla", true, Maintenance.MaintenanceStatus.COMPLETED),
                maintenance("MAINT002", "VEH008", null, null,
                        LocalDateTime.now().minusDays(2), "Scheduled maintenance - Ford Transit brake service", false, Maintenance.MaintenanceStatus.IN_PROGRESS),
                maintenance("MAINT003", "VEH006", "BOOK007", "CUST002",
                        LocalDateTime.now().minusDays(10), "Post-rental inspection for Jeep Wrangler", true, Maintenance.MaintenanceStatus.COMPLETED),
                maintenance("MAINT004", "VEH003", null, null,
                        LocalDateTime.now().minusDays(1), "Routine oil change - BMW 3 Series", false, Maintenance.MaintenanceStatus.IN_PROGRESS),
                maintenance("MAINT005", "VEH004", "BOOK004", "CUST003",
                        LocalDateTime.now().minusDays(4), "Post-rental inspection for Toyota RAV4", false, Maintenance.MaintenanceStatus.COMPLETED)
        );

        maintenanceRepository.saveAll(records);
        log.info("Seeded {} maintenance records", records.size());

        List<Damage> damages = List.of(
                damage("DMG001", "MAINT001", "VEH001", "BOOK001",
                        Damage.DamageType.SCRATCH, "Front bumper scratch (15cm)", 150.00),
                damage("DMG002", "MAINT003", "VEH006", "BOOK007",
                        Damage.DamageType.TIRE, "Rear left tire damage - needs replacement", 75.00),
                damage("DMG003", "MAINT003", "VEH006", "BOOK007",
                        Damage.DamageType.INTERIOR, "Coffee stain on passenger seat", 50.00)
        );

        damageRepository.saveAll(damages);
        log.info("Seeded {} damage records", damages.size());
    }

    private Maintenance maintenance(String id, String vehicleId, String bookingId, String customerId,
                                     LocalDateTime inspDate, String desc, boolean hasDmg, Maintenance.MaintenanceStatus status) {
        Maintenance m = new Maintenance();
        m.setMaintenanceId(id);
        m.setVehicleId(vehicleId);
        m.setBookingId(bookingId);
        m.setCustomerId(customerId);
        m.setInspectionDate(inspDate);
        m.setDescription(desc);
        m.setHasDamage(hasDmg);
        m.setStatus(status);
        return m;
    }

    private Damage damage(String id, String inspectionId, String vehicleId, String bookingId,
                          Damage.DamageType type, String desc, double cost) {
        Damage d = new Damage();
        d.setDamageId(id);
        d.setInspectionId(inspectionId);
        d.setVehicleId(vehicleId);
        d.setBookingId(bookingId);
        d.setDamageType(type);
        d.setDescription(desc);
        d.setEstimatedCost(cost);
        return d;
    }
}
