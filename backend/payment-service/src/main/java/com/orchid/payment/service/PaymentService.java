package com.orchid.payment.service;

import com.orchid.payment.client.NotificationClient;
import com.orchid.payment.dto.PaymentDTO;
import com.orchid.payment.model.Payment;
import com.orchid.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final NotificationClient notificationClient;

    public Payment createPayment(PaymentDTO dto) {
        Payment payment = new Payment();
        payment.setBookingId(dto.getBookingId());
        payment.setCustomerId(dto.getCustomerId());
        payment.setAmount(dto.getAmount());
        payment.setPaymentType(Payment.PaymentType.valueOf(dto.getPaymentType()));
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        payment.setStage(dto.getStage() != null ? dto.getStage() : "ADVANCE");

        Payment saved = paymentRepository.save(payment);
        log.info("Payment created: {} for booking: {} type: {}", saved.getPaymentId(), dto.getBookingId(), dto.getPaymentType());

        String notifType = saved.getPaymentStatus() == Payment.PaymentStatus.SUCCESS
                ? "PAYMENT_SUCCESS" : "PAYMENT_FAILURE";

        String typeLabel = switch (saved.getPaymentType()) {
            case ADVANCE_DEPOSIT -> "Advance Deposit";
            case RENTAL_BALANCE -> "Final Rental Balance";
            case DAMAGE -> "Damage Charge";
            case REFUND -> "Refund";
        };

        String message = String.format(
                "Payment Receipt\n\nType: %s\nAmount: LKR %.2f\nBooking: %s\nStatus: %s\nDate: %s",
                typeLabel, saved.getAmount(), saved.getBookingId(),
                saved.getPaymentStatus().name(), saved.getPaymentDate().toString());

        notificationClient.sendNotification(
                dto.getCustomerId(), dto.getCustomerEmail(), message, notifType);

        return saved;
    }

    public Payment updatePaymentStatus(String id, String status) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
        payment.setPaymentStatus(Payment.PaymentStatus.valueOf(status));
        return paymentRepository.save(payment);
    }

    public Payment getPaymentById(String id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));
    }

    public List<Payment> getPaymentsByBookingId(String bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    public List<Payment> getPaymentsByCustomerId(String customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment refundPayment(String id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + id));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.SUCCESS) {
            throw new RuntimeException("Only successful payments can be refunded");
        }

        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        Payment saved = paymentRepository.save(payment);

        String message = String.format(
                "Refund Processed\n\nAmount: LKR %.2f\nBooking: %s\nOriginal Payment Type: %s",
                saved.getAmount(), saved.getBookingId(), saved.getPaymentType().name());
        notificationClient.sendNotification(
                saved.getCustomerId(), null, message, "PAYMENT_SUCCESS");

        return saved;
    }
}
