package com.orchid.notification.controller;

import com.orchid.notification.config.RoleAccessConfig;
import com.orchid.notification.dto.NotificationDTO;
import com.orchid.notification.model.Notification;
import com.orchid.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final RoleAccessConfig accessConfig;

    @PostMapping("/send")
    public ResponseEntity<Notification> sendNotification(@Valid @RequestBody NotificationDTO dto,
                                                          @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getNotificationSendRoles(), "Sending notifications");
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.sendNotification(dto));
    }

    @GetMapping("/user/{targetUserId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable String targetUserId,
                                                                    @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                                    @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null) {
            // internal service-to-service call - allow
        } else if (accessConfig.getNotificationViewRoles().contains(role)) {
            // Staff can view any user's notifications
        } else if ("CUSTOMER".equals(role) && userId != null && userId.equals(targetUserId)) {
            // Customers can view their own notifications
        } else {
            throw new RuntimeException("Access denied: You can only view your own notifications");
        }
        return ResponseEntity.ok(notificationService.getNotificationsByUserId(targetUserId));
    }

    @GetMapping("/user/{targetUserId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable String targetUserId,
                                                             @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                             @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role != null && "CUSTOMER".equals(role) && userId != null && !userId.equals(targetUserId)) {
            throw new RuntimeException("Access denied");
        }
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(targetUserId)));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String notificationId,
                                                    @RequestHeader(value = "X-User-Role", required = false) String role) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId));
    }

    @PutMapping("/user/{targetUserId}/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@PathVariable String targetUserId,
                                                              @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                              @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role != null && "CUSTOMER".equals(role) && userId != null && !userId.equals(targetUserId)) {
            throw new RuntimeException("Access denied");
        }
        notificationService.markAllAsRead(targetUserId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    private void validateRole(String userRole, List<String> allowedRoles, String operation) {
        if (userRole == null) return;
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
