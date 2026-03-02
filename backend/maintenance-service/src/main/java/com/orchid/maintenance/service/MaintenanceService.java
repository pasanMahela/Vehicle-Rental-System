package com.orchid.maintenance.service;

import com.orchid.maintenance.client.NotificationClient;
import com.orchid.maintenance.client.PaymentClient;
import com.orchid.maintenance.client.VehicleClient;
import com.orchid.maintenance.dto.DamageDTO;
import com.orchid.maintenance.dto.InspectionRequest;
import com.orchid.maintenance.dto.MaintenanceDTO;
import com.orchid.maintenance.model.Damage;
import com.orchid.maintenance.model.Maintenance;
import com.orchid.maintenance.repository.DamageRepository;
import com.orchid.maintenance.repository.MaintenanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final DamageRepository damageRepository;
    private final VehicleClient vehicleClient;
    private final PaymentClient paymentClient;
    private final NotificationClient notificationClient;

    public Maintenance addMaintenanceRecord(MaintenanceDTO dto) {
        Maintenance maintenance = new Maintenance();
        maintenance.setVehicleId(dto.getVehicleId());
        maintenance.setBookingId(dto.getBookingId());
        maintenance.setCustomerId(dto.getCustomerId());
        maintenance.setInspectionDate(LocalDateTime.now());
        maintenance.setDescription(dto.getDescription());
        maintenance.setHasDamage(dto.isHasDamage());
        maintenance.setStatus(Maintenance.MaintenanceStatus.IN_PROGRESS);

        vehicleClient.updateVehicleStatus(dto.getVehicleId(), "MAINTENANCE");

        return maintenanceRepository.save(maintenance);
    }

    public Maintenance updateMaintenanceRecord(String id, MaintenanceDTO dto) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance record not found with id: " + id));

        if (dto.getDescription() != null) maintenance.setDescription(dto.getDescription());
        maintenance.setHasDamage(dto.isHasDamage());

        if (dto.getStatus() != null) {
            Maintenance.MaintenanceStatus newStatus =
                    Maintenance.MaintenanceStatus.valueOf(dto.getStatus());
            maintenance.setStatus(newStatus);

            if (newStatus == Maintenance.MaintenanceStatus.COMPLETED && !maintenance.isHasDamage()) {
                vehicleClient.updateVehicleStatus(maintenance.getVehicleId(), "AVAILABLE");
            }
        }

        return maintenanceRepository.save(maintenance);
    }

    public void deleteMaintenanceRecord(String id) {
        if (!maintenanceRepository.existsById(id)) {
            throw new RuntimeException("Maintenance record not found with id: " + id);
        }
        maintenanceRepository.deleteById(id);
    }

    public List<Maintenance> getMaintenanceByVehicleId(String vehicleId) {
        return maintenanceRepository.findByVehicleIdOrderByInspectionDateDesc(vehicleId);
    }

    public Maintenance createInspection(InspectionRequest request) {
        Maintenance maintenance = new Maintenance();
        maintenance.setVehicleId(request.getVehicleId());
        maintenance.setBookingId(request.getBookingId());
        maintenance.setCustomerId(request.getCustomerId());
        maintenance.setInspectionDate(LocalDateTime.now());
        maintenance.setDescription("Vehicle return inspection");
        maintenance.setHasDamage(false);
        maintenance.setStatus(Maintenance.MaintenanceStatus.IN_PROGRESS);

        vehicleClient.updateVehicleStatus(request.getVehicleId(), "MAINTENANCE");

        Maintenance saved = maintenanceRepository.save(maintenance);

        notificationClient.sendNotification(
                request.getCustomerId(), null,
                String.format("Vehicle return inspection started for booking %s.", request.getBookingId()),
                "MAINTENANCE_ALERT");

        log.info("Inspection created: {} for vehicle: {}", saved.getMaintenanceId(), request.getVehicleId());
        return saved;
    }

    public Damage recordDamage(String maintenanceId, DamageDTO dto) {
        Maintenance maintenance = maintenanceRepository.findById(maintenanceId)
                .orElseThrow(() -> new RuntimeException("Maintenance record not found with id: " + maintenanceId));

        maintenance.setHasDamage(true);
        maintenanceRepository.save(maintenance);

        Damage damage = new Damage();
        damage.setInspectionId(maintenanceId);
        damage.setVehicleId(maintenance.getVehicleId());
        damage.setBookingId(maintenance.getBookingId());
        damage.setDamageType(Damage.DamageType.valueOf(dto.getDamageType()));
        damage.setDescription(dto.getDescription());
        damage.setEstimatedCost(dto.getEstimatedCost());

        Damage saved = damageRepository.save(damage);

        if (maintenance.getCustomerId() != null && maintenance.getBookingId() != null) {
            paymentClient.createDamagePayment(
                    maintenance.getBookingId(),
                    maintenance.getCustomerId(),
                    dto.getEstimatedCost(),
                    null);

            String message = String.format(
                    "Damage found during inspection: %s - %s. Estimated cost: $%.2f",
                    dto.getDamageType(), dto.getDescription(), dto.getEstimatedCost());
            notificationClient.sendNotification(
                    maintenance.getCustomerId(), null, message, "DAMAGE_CHARGE");
        }

        log.info("Damage recorded: {} for inspection: {}", saved.getDamageId(), maintenanceId);
        return saved;
    }

    public Maintenance completeMaintenanceRecord(String id) {
        Maintenance maintenance = maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance record not found with id: " + id));

        maintenance.setStatus(Maintenance.MaintenanceStatus.COMPLETED);
        Maintenance saved = maintenanceRepository.save(maintenance);

        vehicleClient.updateVehicleStatus(maintenance.getVehicleId(), "AVAILABLE");

        log.info("Maintenance completed: {} - vehicle {} set to AVAILABLE",
                saved.getMaintenanceId(), maintenance.getVehicleId());
        return saved;
    }

    public List<Damage> getDamagesByInspectionId(String inspectionId) {
        return damageRepository.findByInspectionId(inspectionId);
    }
}
