package com.orchid.payment.config;

import com.orchid.payment.model.Payment;
import com.orchid.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PaymentRepository paymentRepository;

    @Override
    public void run(String... args) {
        if (paymentRepository.count() > 0) {
            log.info("Payments already exist, skipping seed");
            return;
        }

        List<Payment> payments = List.of(
                payment("PAY001", "BOOK001", "CUST001", 5000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusDays(10)),
                payment("PAY002", "BOOK001", "CUST001", 17500.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.RENTAL_BALANCE, "FINAL", LocalDateTime.now().minusDays(5)),
                payment("PAY003", "BOOK002", "CUST002", 5000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusDays(3)),
                payment("PAY004", "BOOK004", "CUST003", 8000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusDays(7)),
                payment("PAY005", "BOOK004", "CUST003", 13000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.RENTAL_BALANCE, "FINAL", LocalDateTime.now().minusDays(4)),
                payment("PAY006", "BOOK005", "CUST004", 5000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusDays(2)),
                payment("PAY007", "BOOK007", "CUST002", 8000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusDays(15)),
                payment("PAY008", "BOOK007", "CUST002", 37000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.RENTAL_BALANCE, "FINAL", LocalDateTime.now().minusDays(10)),
                payment("PAY009", "BOOK008", "CUST003", 5000.0,
                        Payment.PaymentStatus.REFUNDED, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusDays(20)),
                payment("PAY010", "BOOK001", "CUST001", 15000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.DAMAGE, "FINAL", LocalDateTime.now().minusDays(4)),
                payment("PAY011", "BOOK006", "CUST005", 12000.0,
                        Payment.PaymentStatus.SUCCESS, Payment.PaymentType.ADVANCE_DEPOSIT, "ADVANCE", LocalDateTime.now().minusHours(5))
        );

        paymentRepository.saveAll(payments);
        log.info("Seeded {} sample payments", payments.size());
    }

    private Payment payment(String id, String bookingId, String customerId, double amount,
                            Payment.PaymentStatus status, Payment.PaymentType type, String stage, LocalDateTime date) {
        Payment p = new Payment();
        p.setPaymentId(id);
        p.setBookingId(bookingId);
        p.setCustomerId(customerId);
        p.setAmount(amount);
        p.setPaymentStatus(status);
        p.setPaymentType(type);
        p.setStage(stage);
        p.setPaymentDate(date);
        return p;
    }
}
