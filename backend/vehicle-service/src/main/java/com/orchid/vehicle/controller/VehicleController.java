package com.orchid.vehicle.controller;

import com.orchid.vehicle.config.RoleAccessConfig;
import com.orchid.vehicle.dto.VehicleDTO;
import com.orchid.vehicle.model.Vehicle;
import com.orchid.vehicle.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final RoleAccessConfig accessConfig;

    @PostMapping
    public ResponseEntity<Vehicle> addVehicle(@Valid @RequestBody VehicleDTO dto,
                                              @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getVehicleCrudRoles(), "Vehicle CRUD");
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.addVehicle(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable String id,
                                                 @Valid @RequestBody VehicleDTO dto,
                                                 @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getVehicleCrudRoles(), "Vehicle CRUD");
        return ResponseEntity.ok(vehicleService.updateVehicle(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable String id,
                                              @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getVehicleCrudRoles(), "Vehicle CRUD");
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable String id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Vehicle>> getAvailableVehicles() {
        return ResponseEntity.ok(vehicleService.getAvailableVehicles());
    }

    @GetMapping("/brands")
    public ResponseEntity<List<String>> getDistinctBrands() {
        return ResponseEntity.ok(vehicleService.getDistinctBrands());
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getDistinctTypes() {
        return ResponseEntity.ok(vehicleService.getDistinctTypes());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Vehicle> updateVehicleStatus(@PathVariable String id,
                                                       @RequestBody Map<String, String> body,
                                                       @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getVehicleStatusRoles(), "Vehicle status update");
        return ResponseEntity.ok(vehicleService.updateVehicleStatus(id, body.get("status")));
    }

    private void validateRole(String userRole, List<String> allowedRoles, String operation) {
        if (userRole == null) return;
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
