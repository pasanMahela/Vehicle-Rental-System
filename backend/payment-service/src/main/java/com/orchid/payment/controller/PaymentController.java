package com.orchid.payment.controller;

import com.orchid.payment.config.RoleAccessConfig;
import com.orchid.payment.dto.PaymentDTO;
import com.orchid.payment.model.Payment;
import com.orchid.payment.repository.PaymentRepository;
import com.orchid.payment.client.BookingClient;
import com.orchid.payment.client.VehicleClient;
import com.orchid.payment.service.PaymentService;
import com.orchid.payment.service.StripeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment management APIs for vehicle rental system")
public class PaymentController {

    private final PaymentService paymentService;
    private final RoleAccessConfig accessConfig;
    private final StripeService stripeService;
    private final PaymentRepository paymentRepository;
    private final BookingClient bookingClient;
    private final VehicleClient vehicleClient;

    @Operation(summary = "Create a new payment", description = "Creates a new payment record. Requires BOOKING_CASHIER or OWNER role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Payment created successfully",
                    content = @Content(schema = @Schema(implementation = Payment.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PostMapping
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody PaymentDTO dto,
                                                  @Parameter(description = "User role for authorization")
                                                  @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getPaymentManageRoles(), "Payment creation");
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(dto));
    }

    @Operation(summary = "Get all payments", description = "Retrieves all payments. Customers can only see their own payments.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payments retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @Parameter(description = "User ID for customer filtering")
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Parameter(description = "User role for authorization")
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || accessConfig.getPaymentViewRoles().contains(role)) {
            return ResponseEntity.ok(paymentService.getAllPayments());
        }
        if ("CUSTOMER".equals(role)) {
            return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(userId));
        }
        throw new RuntimeException("Access denied");
    }

    @Operation(summary = "Update payment status", description = "Updates the status of an existing payment. Requires BOOKING_CASHIER or OWNER role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment status updated"),
            @ApiResponse(responseCode = "404", description = "Payment not found"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PutMapping("/{id}/status")
    public ResponseEntity<Payment> updatePaymentStatus(
            @Parameter(description = "Payment ID") @PathVariable String id,
            @RequestBody Map<String, String> body,
            @Parameter(description = "User role for authorization")
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getPaymentManageRoles(), "Payment status update");
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, body.get("status")));
    }

    @Operation(summary = "Get payment by ID", description = "Retrieves a specific payment by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment found"),
            @ApiResponse(responseCode = "404", description = "Payment not found"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @Parameter(description = "Payment ID") @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        Payment payment = paymentService.getPaymentById(id);
        validateViewAccess(payment.getCustomerId(), userId, role);
        return ResponseEntity.ok(payment);
    }

    @Operation(summary = "Get payments by booking ID", description = "Retrieves all payments associated with a booking")
    @ApiResponse(responseCode = "200", description = "Payments retrieved successfully")
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getPaymentsByBookingId(
            @Parameter(description = "Booking ID") @PathVariable String bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentsByBookingId(bookingId));
    }

    @Operation(summary = "Get payments by customer ID", description = "Retrieves all payments for a specific customer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payments retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Payment>> getPaymentsByCustomerId(
            @Parameter(description = "Customer ID") @PathVariable String customerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null) { /* internal */ }
        else if (accessConfig.getPaymentViewRoles().contains(role)) { /* staff */ }
        else if ("CUSTOMER".equals(role) && userId != null && userId.equals(customerId)) { /* own */ }
        else { throw new RuntimeException("Access denied"); }
        return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(customerId));
    }

    @Operation(summary = "Refund a payment", description = "Processes a refund for a successful payment. Requires BOOKING_CASHIER or OWNER role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment refunded successfully"),
            @ApiResponse(responseCode = "400", description = "Payment cannot be refunded"),
            @ApiResponse(responseCode = "404", description = "Payment not found"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @PostMapping("/{id}/refund")
    public ResponseEntity<Payment> refundPayment(
            @Parameter(description = "Payment ID") @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getPaymentManageRoles(), "Payment refund");
        return ResponseEntity.ok(paymentService.refundPayment(id));
    }

    @Operation(summary = "Create Stripe payment intent", description = "Creates a Stripe payment intent for processing card payments")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment intent created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/create-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(@RequestBody Map<String, Object> body) {
        double amount = Double.parseDouble(body.get("amount").toString());
        String bookingId = body.get("bookingId").toString();
        String customerId = body.getOrDefault("customerId", "").toString();

        try {
            Map<String, Object> booking = bookingClient.getBookingById(bookingId);
            if (booking == null) throw new RuntimeException("Booking not found");
            
            String vId = (String) booking.get("vehicleId");
            if (vId != null) {
                Map<String, Object> vehicle = vehicleClient.getVehicleById(vId);
                if (vehicle == null) throw new RuntimeException("Vehicle not found");
            }
        } catch (Exception e) {
            throw new RuntimeException("Booking validation failed: " + e.getMessage());
        }
        String paymentType = body.getOrDefault("paymentType", "RENTAL_BALANCE").toString();
        String stage = body.getOrDefault("stage", "FINAL").toString();
        String currency = body.getOrDefault("currency", "lkr").toString();
        long amountInCents = Math.round(amount * 100);

        Payment payment = new Payment();
        payment.setBookingId(bookingId);
        payment.setCustomerId(customerId);
        payment.setAmount(amount);
        payment.setPaymentType(Payment.PaymentType.valueOf(paymentType));
        payment.setStage(stage);
        payment.setPaymentDate(java.time.LocalDateTime.now());
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        Payment saved = paymentRepository.save(payment);

        Map<String, String> intentResult = stripeService.createPaymentIntent(amountInCents, currency, bookingId);
        java.util.HashMap<String, String> result = new java.util.HashMap<>(intentResult);
        result.put("paymentId", saved.getPaymentId());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/confirm")
    public ResponseEntity<Payment> confirmPayment(@RequestBody Map<String, String> body) {
        String paymentId = body.get("paymentId");
        String stripePaymentIntentId = body.get("paymentIntentId");
        Payment payment = paymentService.getPaymentById(paymentId);
        payment.setStripePaymentIntentId(stripePaymentIntentId);
        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        return ResponseEntity.ok(paymentService.updatePaymentStatus(paymentId, "SUCCESS"));
    }

    private void validateViewAccess(String ownerId, String userId, String role) {
        if (role == null) return;
        if (accessConfig.getPaymentViewRoles().contains(role)) return;
        if ("CUSTOMER".equals(role) && userId != null && userId.equals(ownerId)) return;
        throw new RuntimeException("Access denied: You can only view your own payments");
    }

    private void validateRole(String userRole, List<String> allowedRoles, String operation) {
        if (userRole == null) return;
        if (!allowedRoles.contains(userRole)) {
            throw new RuntimeException("Access denied: " + operation + " requires one of " + allowedRoles);
        }
    }
}
