package com.orchid.booking.service;

import com.orchid.booking.client.MaintenanceClient;
import com.orchid.booking.client.NotificationClient;
import com.orchid.booking.client.PaymentClient;
import com.orchid.booking.client.VehicleClient;
import com.orchid.booking.dto.BookingDTO;
import com.orchid.booking.model.Booking;
import com.orchid.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleClient vehicleClient;
    private final PaymentClient paymentClient;
    private final NotificationClient notificationClient;
    private final MaintenanceClient maintenanceClient;

    public Booking createBooking(BookingDTO dto) {
        Map<String, Object> vehicle = vehicleClient.getVehicleById(dto.getVehicleId());

        String status = (String) vehicle.get("availabilityStatus");
        if (!"AVAILABLE".equals(status)) {
            throw new RuntimeException("Vehicle is not available for booking");
        }

        double pricePerDay = ((Number) vehicle.get("pricePerDay")).doubleValue();
        long days = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate());
        if (days <= 0) {
            throw new RuntimeException("End date must be after start date");
        }

        double totalAmount = pricePerDay * days;
        double advanceDeposit = vehicle.get("advanceDeposit") != null
                ? ((Number) vehicle.get("advanceDeposit")).doubleValue() : 5000.0;

        Booking booking = new Booking();
        booking.setVehicleId(dto.getVehicleId());
        booking.setCustomerId(dto.getCustomerId());
        booking.setCustomerEmail(dto.getCustomerEmail());
        booking.setStartDate(dto.getStartDate());
        booking.setEndDate(dto.getEndDate());
        booking.setTotalAmount(totalAmount);
        booking.setAdvancePaid(advanceDeposit);
        booking.setRemainingBalance(totalAmount - advanceDeposit);
        booking.setFinalPaymentDone(false);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);

        Booking saved = bookingRepository.save(booking);

        vehicleClient.updateVehicleStatus(dto.getVehicleId(), "BOOKED");

        paymentClient.createPayment(saved.getBookingId(), saved.getCustomerId(),
                advanceDeposit, "ADVANCE_DEPOSIT", saved.getCustomerEmail());

        String vehicleName = vehicle.get("brand") + " " + vehicle.get("model");
        String message = String.format(
                "Booking %s confirmed!\nVehicle: %s\nPeriod: %s to %s\n\nTotal Rental: LKR %.2f\nAdvance Paid: LKR %.2f\nRemaining Balance: LKR %.2f",
                saved.getBookingId(), vehicleName,
                saved.getStartDate(), saved.getEndDate(),
                totalAmount, advanceDeposit, totalAmount - advanceDeposit);
        notificationClient.sendNotification(
                saved.getCustomerId(), saved.getCustomerEmail(), message, "BOOKING_CONFIRMATION");

        log.info("Booking created: {} with advance deposit: {}", saved.getBookingId(), advanceDeposit);
        return saved;
    }

    public Booking updateBooking(String id, BookingDTO dto) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        if (dto.getStartDate() != null) booking.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) booking.setEndDate(dto.getEndDate());

        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        vehicleClient.updateVehicleStatus(booking.getVehicleId(), "AVAILABLE");

        String message = String.format(
                "Your booking %s has been cancelled. Advance deposit of LKR %.2f will be refunded.",
                saved.getBookingId(), saved.getAdvancePaid());
        notificationClient.sendNotification(
                saved.getCustomerId(), saved.getCustomerEmail(), message, "BOOKING_CANCELLATION");

        log.info("Booking cancelled: {}", saved.getBookingId());
        return saved;
    }

    public Booking completeBooking(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));

        booking.setStatus(Booking.BookingStatus.COMPLETED);
        Booking saved = bookingRepository.save(booking);

        maintenanceClient.createInspection(
                booking.getVehicleId(), booking.getBookingId(), booking.getCustomerId());

        log.info("Booking completed: {}", saved.getBookingId());
        return saved;
    }

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    public List<Booking> getBookingsByCustomerId(String customerId) {
        return bookingRepository.findByCustomerId(customerId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}
