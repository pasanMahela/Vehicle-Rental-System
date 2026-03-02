package com.orchid.auth.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String userId;

    @Indexed(unique = true)
    private String username;

    private String password;

    private String email;

    private Role role;

    private boolean verified;

    private String verificationCode;

    private LocalDateTime verificationCodeExpiry;

    public enum Role {
        CUSTOMER, BOOKING_CASHIER, REPAIR_ADVISOR, OWNER
    }
}
