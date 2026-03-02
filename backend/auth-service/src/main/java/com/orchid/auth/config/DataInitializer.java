package com.orchid.auth.config;

import com.orchid.auth.model.User;
import com.orchid.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        ensureAdminVerified();

        if (userRepository.count() > 1) {
            log.info("Sample users already exist, skipping seed");
            return;
        }

        List<User> users = List.of(
                createUser("cashier1", "cashier1@orchid.com", "Pass@123", User.Role.BOOKING_CASHIER),
                createUser("cashier2", "cashier2@orchid.com", "Pass@123", User.Role.BOOKING_CASHIER),
                createUser("advisor1", "advisor1@orchid.com", "Pass@123", User.Role.REPAIR_ADVISOR),
                createUser("advisor2", "advisor2@orchid.com", "Pass@123", User.Role.REPAIR_ADVISOR),
                createUser("customer1", "customer1@gmail.com", "Pass@123", User.Role.CUSTOMER),
                createUser("customer2", "customer2@gmail.com", "Pass@123", User.Role.CUSTOMER),
                createUser("customer3", "customer3@gmail.com", "Pass@123", User.Role.CUSTOMER),
                createUser("customer4", "customer4@gmail.com", "Pass@123", User.Role.CUSTOMER),
                createUser("customer5", "customer5@gmail.com", "Pass@123", User.Role.CUSTOMER)
        );

        userRepository.saveAll(users);
        log.info("Seeded {} sample users", users.size());
    }

    private void ensureAdminVerified() {
        var existing = userRepository.findByUsername("admin");
        if (existing.isPresent()) {
            User admin = existing.get();
            if (!admin.isVerified()) {
                admin.setVerified(true);
                admin.setVerificationCode(null);
                admin.setVerificationCodeExpiry(null);
                userRepository.save(admin);
                log.info("Default admin user was unverified — marked as verified");
            }
        } else {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("1234Pasan."));
            admin.setEmail("admin@orchid.com");
            admin.setRole(User.Role.OWNER);
            admin.setVerified(true);
            userRepository.save(admin);
            log.info("Default admin user created (username: admin, role: OWNER)");
        }
    }

    private User createUser(String username, String email, String password, User.Role role) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setRole(role);
        u.setVerified(true);
        return u;
    }
}
