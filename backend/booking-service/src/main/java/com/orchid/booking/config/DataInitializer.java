package com.orchid.booking.config;

import com.orchid.booking.model.Booking;
import com.orchid.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final BookingRepository bookingRepository;

    @Override
    public void run(String... args) {
        if (bookingRepository.count() > 0) {
            log.info("Bookings already exist, skipping seed");
            return;
        }

        List<Booking> bookings = List.of(
                booking("BOOK001", "VEH001", "CUST001", "customer1@gmail.com",
                        LocalDate.now().minusDays(10), LocalDate.now().minusDays(5), 22500.0, 5000.0, true, Booking.BookingStatus.COMPLETED),
                booking("BOOK002", "VEH003", "CUST002", "customer2@gmail.com",
                        LocalDate.now().minusDays(3), LocalDate.now().plusDays(2), 42500.0, 5000.0, false, Booking.BookingStatus.CONFIRMED),
                booking("BOOK003", "VEH005", "CUST001", "customer1@gmail.com",
                        LocalDate.now().plusDays(1), LocalDate.now().plusDays(5), 32000.0, 8000.0, false, Booking.BookingStatus.PENDING),
                booking("BOOK004", "VEH004", "CUST003", "customer3@gmail.com",
                        LocalDate.now().minusDays(7), LocalDate.now().minusDays(4), 21000.0, 8000.0, true, Booking.BookingStatus.COMPLETED),
                booking("BOOK005", "VEH002", "CUST004", "customer4@gmail.com",
                        LocalDate.now().minusDays(2), LocalDate.now().plusDays(3), 25000.0, 5000.0, false, Booking.BookingStatus.CONFIRMED),
                booking("BOOK006", "VEH009", "CUST005", "customer5@gmail.com",
                        LocalDate.now().plusDays(3), LocalDate.now().plusDays(7), 44000.0, 12000.0, false, Booking.BookingStatus.PENDING),
                booking("BOOK007", "VEH006", "CUST002", "customer2@gmail.com",
                        LocalDate.now().minusDays(15), LocalDate.now().minusDays(10), 45000.0, 8000.0, true, Booking.BookingStatus.COMPLETED),
                booking("BOOK008", "VEH001", "CUST003", "customer3@gmail.com",
                        LocalDate.now().minusDays(20), LocalDate.now().minusDays(17), 13500.0, 5000.0, false, Booking.BookingStatus.CANCELLED)
        );

        bookingRepository.saveAll(bookings);
        log.info("Seeded {} sample bookings", bookings.size());
    }

    private Booking booking(String id, String vehicleId, String customerId, String email,
                            LocalDate start, LocalDate end, double amount, double advance,
                            boolean finalDone, Booking.BookingStatus status) {
        Booking b = new Booking();
        b.setBookingId(id);
        b.setVehicleId(vehicleId);
        b.setCustomerId(customerId);
        b.setCustomerEmail(email);
        b.setStartDate(start);
        b.setEndDate(end);
        b.setTotalAmount(amount);
        b.setAdvancePaid(advance);
        b.setRemainingBalance(amount - advance);
        b.setFinalPaymentDone(finalDone);
        b.setStatus(status);
        return b;
    }
}
