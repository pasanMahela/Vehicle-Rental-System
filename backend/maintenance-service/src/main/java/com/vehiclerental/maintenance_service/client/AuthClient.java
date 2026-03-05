package com.vehiclerental.maintenance_service.client;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@Slf4j
public class AuthClient {

    private final WebClient webClient;

    public AuthClient(@Value("${auth.service.url}") String authServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(authServiceUrl)
                .build();
    }

    public UserInfo getUserById(String userId) {
        try {
            return webClient.get()
                    .uri("/api/auth/users/{userId}", userId)
                    .retrieve()
                    .bodyToMono(UserInfo.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to fetch user details for userId: {} - {}", userId, e.getMessage());
            return null;
        }
    }

    @Data
    public static class UserInfo {
        private String userId;
        private String username;
        private String email;
        private String role;
    }
}
