package com.orchid.auth.service;

import com.orchid.auth.dto.AuthResponse;
import com.orchid.auth.dto.LoginRequest;
import com.orchid.auth.dto.RegisterRequest;
import com.orchid.auth.dto.UserResponse;
import com.orchid.auth.model.User;
import com.orchid.auth.repository.UserRepository;
import com.orchid.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;

    private static final int CODE_EXPIRY_MINUTES = 10;

    public Map<String, String> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setVerified(false);

        User.Role role = User.Role.CUSTOMER;
        String roleStr = request.getRole();
        if (roleStr != null) {
            try {
                role = User.Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }
        user.setRole(role);

        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));

        User savedUser = userRepository.save(user);
        sendVerificationEmail(savedUser.getEmail(), code);

        return Map.of(
                "message", "Registration successful. Please check your email for the verification code.",
                "userId", savedUser.getUserId()
        );
    }

    public AuthResponse verifyEmail(String userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new RuntimeException("Invalid verification code");
        }

        if (user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired. Please request a new one.");
        }

        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUserId(), user.getUsername(), user.getRole().name());
    }

    public Map<String, String> resendCode(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES));
        userRepository.save(user);

        sendVerificationEmail(user.getEmail(), code);

        return Map.of("message", "A new verification code has been sent to your email.");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!user.isVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email before logging in.");
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUserId(), user.getUsername(), user.getRole().name());
    }

    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toUserResponse(user);
    }

    public UserResponse updateUserRole(String userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            user.setRole(User.Role.valueOf(newRole.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + newRole + ". Valid roles: CUSTOMER, BOOKING_CASHIER, REPAIR_ADVISOR, OWNER");
        }

        User savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    public UserResponse updateUser(String userId, String email, String username) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (email != null && !email.isBlank()) {
            user.setEmail(email);
        }
        if (username != null && !username.isBlank()) {
            if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(username);
        }

        User savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(userId);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getUserId(), user.getUsername(), user.getEmail(), user.getRole().name());
    }

    private String generateCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    private void sendVerificationEmail(String to, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Vehicle Rental System - Email Verification");
            message.setText(
                    "Welcome to the Vehicle Rental System!\n\n" +
                    "Your verification code is: " + code + "\n\n" +
                    "This code will expire in " + CODE_EXPIRY_MINUTES + " minutes.\n\n" +
                    "If you did not register, please ignore this email."
            );
            mailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", to, e.getMessage());
        }
    }
}
