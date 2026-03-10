package com.vehiclerental.maintenance_service.client;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@Slf4j
public class AuthClient {

    private final WebClient webClient;
    private final RequestAuthHeaderProvider authHeaderProvider;

    public AuthClient(@Value("${auth.service.url}") String authServiceUrl,
                      RequestAuthHeaderProvider authHeaderProvider) {
        this.webClient = WebClient.builder()
                .baseUrl(authServiceUrl)
                .build();
        this.authHeaderProvider = authHeaderProvider;
    }

    public UserInfo getUserById(String userId) {
        try {
            String authorization = authHeaderProvider.getAuthorizationHeader();

            return webClient.get()
                    .uri("/api/auth/users/{userId}", userId)
                    .headers(headers -> {
                        if (authorization != null && !authorization.isBlank()) {
                            headers.set(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    })
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
