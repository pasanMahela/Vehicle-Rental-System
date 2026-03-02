package com.orchid.vehicle.controller;

import com.orchid.vehicle.config.RoleAccessConfig;
import com.orchid.vehicle.model.SystemSettings;
import com.orchid.vehicle.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsRepository settingsRepository;
    private final RoleAccessConfig accessConfig;

    @GetMapping
    public ResponseEntity<SystemSettings> getSettings() {
        return ResponseEntity.ok(
                settingsRepository.findAll().stream().findFirst()
                        .orElseGet(() -> {
                            SystemSettings s = new SystemSettings();
                            s.setAdvanceDepositByType(Map.of(
                                    "SEDAN", 5000.0, "SUV", 8000.0, "VAN", 10000.0,
                                    "ELECTRIC", 12000.0, "TRUCK", 7000.0, "MOTORCYCLE", 3000.0
                            ));
                            return settingsRepository.save(s);
                        })
        );
    }

    @PutMapping
    public ResponseEntity<SystemSettings> updateSettings(@RequestBody SystemSettings settings,
                                                          @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role != null && !"OWNER".equals(role)) {
            throw new RuntimeException("Access denied: Only OWNER can update settings");
        }
        SystemSettings existing = settingsRepository.findAll().stream().findFirst()
                .orElse(new SystemSettings());
        existing.setAdvanceDepositByType(settings.getAdvanceDepositByType());
        return ResponseEntity.ok(settingsRepository.save(existing));
    }

    private void validateRole(String userRole, List<String> allowedRoles, String operation) {
        if (userRole == null) return;
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
