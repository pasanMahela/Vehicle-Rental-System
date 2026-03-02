package com.orchid.maintenance.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "access-control")
@Getter
@Setter
public class RoleAccessConfig {

    private String maintenanceManage;

    public List<String> getMaintenanceManageRoles() {
        return parseRoles(maintenanceManage);
    }

    private List<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) return List.of();
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .toList();
    }
}
