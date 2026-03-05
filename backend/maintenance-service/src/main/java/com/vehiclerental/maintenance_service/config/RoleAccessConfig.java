package com.vehiclerental.maintenance_service.config;

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
    private String issueReport;
    private String maintenanceSchedule;

    public List<String> getMaintenanceManageRoles() {
        return parseRoles(maintenanceManage);
    }

    public List<String> getIssueReportRoles() {
        return parseRoles(issueReport);
    }

    public List<String> getMaintenanceScheduleRoles() {
        return parseRoles(maintenanceSchedule);
    }

    private List<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) return List.of();
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .toList();
    }
}
