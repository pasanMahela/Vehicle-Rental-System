package com.orchid.maintenance.controller;

import com.orchid.maintenance.config.RoleAccessConfig;
import com.orchid.maintenance.dto.DamageDTO;
import com.orchid.maintenance.dto.InspectionRequest;
import com.orchid.maintenance.dto.MaintenanceDTO;
import com.orchid.maintenance.model.Damage;
import com.orchid.maintenance.model.Maintenance;
import com.orchid.maintenance.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final RoleAccessConfig accessConfig;

    @PostMapping
    public ResponseEntity<Maintenance> addMaintenanceRecord(@Valid @RequestBody MaintenanceDTO dto,
                                                            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Maintenance record creation");
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.addMaintenanceRecord(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Maintenance> updateMaintenanceRecord(@PathVariable String id,
                                                               @RequestBody MaintenanceDTO dto,
                                                               @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Maintenance record update");
        return ResponseEntity.ok(maintenanceService.updateMaintenanceRecord(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenanceRecord(@PathVariable String id,
                                                        @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Maintenance record deletion");
        maintenanceService.deleteMaintenanceRecord(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<Maintenance>> getMaintenanceByVehicleId(@PathVariable String vehicleId,
                                                                       @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Maintenance history viewing");
        return ResponseEntity.ok(maintenanceService.getMaintenanceByVehicleId(vehicleId));
    }

    @PostMapping("/inspect")
    public ResponseEntity<Maintenance> createInspection(@Valid @RequestBody InspectionRequest request,
                                                        @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Vehicle inspection");
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.createInspection(request));
    }

    @PostMapping("/{id}/damage")
    public ResponseEntity<Damage> recordDamage(@PathVariable String id,
                                               @Valid @RequestBody DamageDTO dto,
                                               @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Damage recording");
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceService.recordDamage(id, dto));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Maintenance> completeMaintenance(@PathVariable String id,
                                                           @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Maintenance completion");
        return ResponseEntity.ok(maintenanceService.completeMaintenanceRecord(id));
    }

    @GetMapping("/{id}/damages")
    public ResponseEntity<List<Damage>> getDamagesByInspectionId(@PathVariable String id,
                                                                  @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "Damage viewing");
        return ResponseEntity.ok(maintenanceService.getDamagesByInspectionId(id));
    }

    private void validateRole(String userRole, String operation) {
        if (userRole == null) return; // internal service-to-service call
        List<String> allowedRoles = accessConfig.getMaintenanceManageRoles();
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
