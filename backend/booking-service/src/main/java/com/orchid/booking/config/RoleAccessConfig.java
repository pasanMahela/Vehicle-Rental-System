package com.orchid.booking.config;

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

    private String bookingManage;
    private String bookingComplete;
    private String bookingView;

    public List<String> getBookingManageRoles() {
        return parseRoles(bookingManage);
    }

    public List<String> getBookingCompleteRoles() {
        return parseRoles(bookingComplete);
    }

    public List<String> getBookingViewRoles() {
        return parseRoles(bookingView);
    }

    private List<String> parseRoles(String roles) {
        if (roles == null || roles.isBlank()) return List.of();
        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .toList();
    }
}
