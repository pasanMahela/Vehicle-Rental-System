package com.orchid.booking.controller;

import com.orchid.booking.config.RoleAccessConfig;
import com.orchid.booking.dto.BookingDTO;
import com.orchid.booking.model.Booking;
import com.orchid.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final RoleAccessConfig accessConfig;

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingDTO dto,
                                                 @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                 @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null) {
            // internal service-to-service call - allow
        } else if (isStaffRole(role, accessConfig.getBookingManageRoles())) {
            // Staff can create bookings for any customer
        } else if ("CUSTOMER".equals(role)) {
            dto.setCustomerId(userId);
        } else {
            throw new RuntimeException("Access denied: Booking creation requires one of " + accessConfig.getBookingManageRoles() + " or CUSTOMER");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable String id,
                                                 @RequestBody BookingDTO dto,
                                                 @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                 @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateManageAccess(bookingService.getBookingById(id).getCustomerId(), userId, role);
        return ResponseEntity.ok(bookingService.updateBooking(id, dto));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String id,
                                                 @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                 @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateManageAccess(bookingService.getBookingById(id).getCustomerId(), userId, role);
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Booking> completeBooking(@PathVariable String id,
                                                   @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getBookingCompleteRoles(), "Booking completion");
        return ResponseEntity.ok(bookingService.completeBooking(id));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || isStaffRole(role, accessConfig.getBookingViewRoles())) {
            return ResponseEntity.ok(bookingService.getAllBookings());
        }
        if ("CUSTOMER".equals(role)) {
            return ResponseEntity.ok(bookingService.getBookingsByCustomerId(userId));
        }
        throw new RuntimeException("Access denied");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable String id,
                                                  @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                  @RequestHeader(value = "X-User-Role", required = false) String role) {
        Booking booking = bookingService.getBookingById(id);
        validateViewAccess(booking.getCustomerId(), userId, role);
        return ResponseEntity.ok(booking);
    }

    @GetMapping("/vehicle-counts")
    public ResponseEntity<Map<String, Long>> getBookingCountsByVehicle() {
        return ResponseEntity.ok(bookingService.getBookingCountsByVehicle());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Booking>> getBookingsByCustomerId(@PathVariable String customerId,
                                                                 @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                                 @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateViewAccess(customerId, userId, role);
        return ResponseEntity.ok(bookingService.getBookingsByCustomerId(customerId));
    }

    private void validateManageAccess(String ownerId, String userId, String role) {
        if (role == null) return; // internal service-to-service call
        if (isStaffRole(role, accessConfig.getBookingManageRoles())) return;
        if ("CUSTOMER".equals(role) && userId != null && userId.equals(ownerId)) return;
        throw new RuntimeException("Access denied: You can only manage your own bookings");
    }

    private void validateViewAccess(String ownerId, String userId, String role) {
        if (role == null) return; // internal service-to-service call
        if (isStaffRole(role, accessConfig.getBookingViewRoles())) return;
        if ("CUSTOMER".equals(role) && userId != null && userId.equals(ownerId)) return;
        throw new RuntimeException("Access denied: You can only view your own bookings");
    }

    private boolean isStaffRole(String role, List<String> allowedRoles) {
        return role != null && allowedRoles.contains(role);
    }

    private void validateRole(String userRole, List<String> allowedRoles, String operation) {
        if (userRole == null) return; // internal service-to-service call
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
