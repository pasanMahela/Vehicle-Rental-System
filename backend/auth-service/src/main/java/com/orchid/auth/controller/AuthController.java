package com.orchid.auth.controller;

import com.orchid.auth.config.RoleAccessConfig;
import com.orchid.auth.dto.AuthResponse;
import com.orchid.auth.dto.LoginRequest;
import com.orchid.auth.dto.RegisterRequest;
import com.orchid.auth.dto.UserResponse;
import com.orchid.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RoleAccessConfig accessConfig;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String callerRole) {
        String requestedRole = request.getRole();
        if (requestedRole != null && !requestedRole.equalsIgnoreCase("CUSTOMER")) {
            if (callerRole == null || !callerRole.equals("OWNER")) {
                throw new RuntimeException("Only an OWNER can create non-CUSTOMER accounts");
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyEmail(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verifyEmail(body.get("userId"), body.get("code")));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<Map<String, String>> resendCode(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.resendCode(body.get("userId")));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Boolean>> validateToken(@RequestParam String token) {
        boolean isValid = authService.validateToken(token);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "User management");
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String userId,
                                                     @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "User management");
        return ResponseEntity.ok(authService.getUserById(userId));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable String userId,
                                                        @RequestBody Map<String, String> body,
                                                        @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "User role update");
        return ResponseEntity.ok(authService.updateUserRole(userId, body.get("role")));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable String userId,
                                                    @RequestBody Map<String, String> body,
                                                    @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "User update");
        return ResponseEntity.ok(authService.updateUser(userId, body.get("email"), body.get("username")));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId,
                                            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, "User deletion");
        authService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    private void validateRole(String userRole, String operation) {
        if (userRole == null) return; // internal service-to-service call
        List<String> allowedRoles = accessConfig.getUserManageRoles();
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
