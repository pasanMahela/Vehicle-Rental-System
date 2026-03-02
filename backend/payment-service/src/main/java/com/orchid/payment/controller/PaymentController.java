package com.orchid.payment.controller;

import com.orchid.payment.config.RoleAccessConfig;
import com.orchid.payment.dto.PaymentDTO;
import com.orchid.payment.model.Payment;
import com.orchid.payment.repository.PaymentRepository;
import com.orchid.payment.service.PaymentService;
import com.orchid.payment.service.StripeService;
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
public class PaymentController {

    private final PaymentService paymentService;
    private final RoleAccessConfig accessConfig;
    private final StripeService stripeService;
    private final PaymentRepository paymentRepository;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody PaymentDTO dto,
                                                  @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getPaymentManageRoles(), "Payment creation");
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(dto));
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null || accessConfig.getPaymentViewRoles().contains(role)) {
            return ResponseEntity.ok(paymentService.getAllPayments());
        }
        if ("CUSTOMER".equals(role)) {
            return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(userId));
        }
        throw new RuntimeException("Access denied");
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Payment> updatePaymentStatus(@PathVariable String id,
                                                       @RequestBody Map<String, String> body,
                                                       @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getPaymentManageRoles(), "Payment status update");
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, body.get("status")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable String id,
                                                   @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                   @RequestHeader(value = "X-User-Role", required = false) String role) {
        Payment payment = paymentService.getPaymentById(id);
        validateViewAccess(payment.getCustomerId(), userId, role);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getPaymentsByBookingId(@PathVariable String bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentsByBookingId(bookingId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Payment>> getPaymentsByCustomerId(@PathVariable String customerId,
                                                                  @RequestHeader(value = "X-User-Id", required = false) String userId,
                                                                  @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (role == null) { /* internal */ }
        else if (accessConfig.getPaymentViewRoles().contains(role)) { /* staff */ }
        else if ("CUSTOMER".equals(role) && userId != null && userId.equals(customerId)) { /* own */ }
        else { throw new RuntimeException("Access denied"); }
        return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(customerId));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<Payment> refundPayment(@PathVariable String id,
                                                 @RequestHeader(value = "X-User-Role", required = false) String role) {
        validateRole(role, accessConfig.getPaymentManageRoles(), "Payment refund");
        return ResponseEntity.ok(paymentService.refundPayment(id));
    }

    @PostMapping("/create-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(@RequestBody Map<String, Object> body) {
        double amount = Double.parseDouble(body.get("amount").toString());
        String bookingId = body.get("bookingId").toString();
        String customerId = body.getOrDefault("customerId", "").toString();
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
