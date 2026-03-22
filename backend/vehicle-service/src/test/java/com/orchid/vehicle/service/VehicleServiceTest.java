package com.orchid.vehicle.service;

import com.orchid.vehicle.client.BookingClient;
import com.orchid.vehicle.dto.VehicleDTO;
import com.orchid.vehicle.model.Vehicle;
import com.orchid.vehicle.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private BookingClient bookingClient;

    @Mock
    private com.orchid.vehicle.client.NotificationClient notificationClient;

    @InjectMocks
    private VehicleService vehicleService;

    private Vehicle sampleVehicle;
    private VehicleDTO sampleDTO;

    @BeforeEach
    void setUp() {
        sampleVehicle = new Vehicle();
        sampleVehicle.setVehicleId("V001");
        sampleVehicle.setBrand("Toyota");
        sampleVehicle.setModel("Corolla");
        sampleVehicle.setType("SEDAN");
        sampleVehicle.setPricePerDay(5000);
        sampleVehicle.setAdvanceDeposit(3000);
        sampleVehicle.setAvailabilityStatus(Vehicle.AvailabilityStatus.AVAILABLE);

        sampleDTO = new VehicleDTO();
        sampleDTO.setVehicleId("V001");
        sampleDTO.setBrand("Toyota");
        sampleDTO.setModel("Corolla");
        sampleDTO.setType("SEDAN");
        sampleDTO.setPricePerDay(5000);
        sampleDTO.setAdvanceDeposit(3000);
    }

    @Test
    void addVehicle_shouldSaveAndReturn() {
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(sampleVehicle);

        Vehicle result = vehicleService.addVehicle(sampleDTO);

        assertNotNull(result);
        assertEquals("Toyota", result.getBrand());
        assertEquals("Corolla", result.getModel());
        assertEquals(Vehicle.AvailabilityStatus.AVAILABLE, result.getAvailabilityStatus());
        verify(vehicleRepository, times(1)).save(any(Vehicle.class));
    }

    @Test
    void addVehicle_shouldSetCustomVehicleId() {
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(i -> i.getArgument(0));

        Vehicle result = vehicleService.addVehicle(sampleDTO);

        assertEquals("V001", result.getVehicleId());
    }

    @Test
    void getVehicleById_shouldReturnVehicle() {
        when(vehicleRepository.findById("V001")).thenReturn(Optional.of(sampleVehicle));

        Vehicle result = vehicleService.getVehicleById("V001");

        assertEquals("V001", result.getVehicleId());
        assertEquals("Toyota", result.getBrand());
    }

    @Test
    void getVehicleById_shouldThrowWhenNotFound() {
        when(vehicleRepository.findById("INVALID")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> vehicleService.getVehicleById("INVALID"));
        assertTrue(ex.getMessage().contains("Vehicle not found"));
    }

    @Test
    void getAllVehicles_shouldReturnList() {
        when(vehicleRepository.findAll()).thenReturn(List.of(sampleVehicle));

        List<Vehicle> result = vehicleService.getAllVehicles();

        assertEquals(1, result.size());
        assertEquals("Toyota", result.get(0).getBrand());
    }

    @Test
    void updateVehicle_shouldUpdateFields() {
        VehicleDTO updateDTO = new VehicleDTO();
        updateDTO.setBrand("Honda");
        updateDTO.setModel("Civic");
        updateDTO.setType("SEDAN");
        updateDTO.setPricePerDay(6000);
        updateDTO.setAdvanceDeposit(4000);
        updateDTO.setAvailabilityStatus("BOOKED");

        when(vehicleRepository.findById("V001")).thenReturn(Optional.of(sampleVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(i -> i.getArgument(0));

        Vehicle result = vehicleService.updateVehicle("V001", updateDTO);

        assertEquals("Honda", result.getBrand());
        assertEquals("Civic", result.getModel());
        assertEquals(6000, result.getPricePerDay());
        assertEquals(Vehicle.AvailabilityStatus.BOOKED, result.getAvailabilityStatus());
    }

    @Test
    void updateVehicle_shouldThrowWhenNotFound() {
        when(vehicleRepository.findById("INVALID")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> vehicleService.updateVehicle("INVALID", sampleDTO));
    }

    @Test
    void deleteVehicle_shouldDelete() {
        when(vehicleRepository.existsById("V001")).thenReturn(true);
        doNothing().when(vehicleRepository).deleteById("V001");

        vehicleService.deleteVehicle("V001");

        verify(vehicleRepository, times(1)).deleteById("V001");
    }

    @Test
    void deleteVehicle_shouldThrowWhenNotFound() {
        when(vehicleRepository.existsById("INVALID")).thenReturn(false);

        assertThrows(RuntimeException.class,
                () -> vehicleService.deleteVehicle("INVALID"));
    }

    @Test
    void updateVehicleStatus_shouldUpdateStatus() {
        when(vehicleRepository.findById("V001")).thenReturn(Optional.of(sampleVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(i -> i.getArgument(0));

        Vehicle result = vehicleService.updateVehicleStatus("V001", "MAINTENANCE");

        assertEquals(Vehicle.AvailabilityStatus.MAINTENANCE, result.getAvailabilityStatus());
    }

    @Test
    void getAvailableVehicles_shouldReturnOnlyAvailable() {
        when(vehicleRepository.findByAvailabilityStatus(Vehicle.AvailabilityStatus.AVAILABLE))
                .thenReturn(List.of(sampleVehicle));

        List<Vehicle> result = vehicleService.getAvailableVehicles();

        assertEquals(1, result.size());
        assertEquals(Vehicle.AvailabilityStatus.AVAILABLE, result.get(0).getAvailabilityStatus());
    }

    @Test
    void getVehiclesRanked_shouldRankByBookingCount() {
        Vehicle v1 = new Vehicle();
        v1.setVehicleId("V001");
        v1.setBrand("Toyota");
        v1.setModel("Corolla");

        Vehicle v2 = new Vehicle();
        v2.setVehicleId("V002");
        v2.setBrand("Honda");
        v2.setModel("Civic");

        Vehicle v3 = new Vehicle();
        v3.setVehicleId("V003");
        v3.setBrand("BMW");
        v3.setModel("3 Series");

        when(vehicleRepository.findAll()).thenReturn(new ArrayList<>(List.of(v1, v2, v3)));
        when(bookingClient.getBookingCountsByVehicle()).thenReturn(
                Map.of("V001", 5L, "V002", 3L, "V003", 5L));

        List<Vehicle> ranked = vehicleService.getVehiclesRanked();

        assertEquals(3, ranked.size());
        // V001 and V003 tied at 5 bookings → rank 1
        assertEquals(1, ranked.get(0).getPopularityRank());
        assertEquals(5, ranked.get(0).getBookingCount());
        assertEquals(1, ranked.get(1).getPopularityRank());
        assertEquals(5, ranked.get(1).getBookingCount());
        // V002 at 3 bookings → rank 3
        assertEquals(3, ranked.get(2).getPopularityRank());
        assertEquals(3, ranked.get(2).getBookingCount());
    }

    @Test
    void getVehiclesRanked_shouldHandleNoBookings() {
        when(vehicleRepository.findAll()).thenReturn(new ArrayList<>(List.of(sampleVehicle)));
        when(bookingClient.getBookingCountsByVehicle()).thenReturn(Collections.emptyMap());

        List<Vehicle> ranked = vehicleService.getVehiclesRanked();

        assertEquals(1, ranked.size());
        assertEquals(0, ranked.get(0).getBookingCount());
        assertEquals(1, ranked.get(0).getPopularityRank());
    }

    @Test
    void getDistinctBrands_shouldReturnSortedUniqueBrands() {
        Vehicle v2 = new Vehicle();
        v2.setBrand("Honda");

        when(vehicleRepository.findAll()).thenReturn(List.of(sampleVehicle, v2, sampleVehicle));

        List<String> brands = vehicleService.getDistinctBrands();

        assertEquals(2, brands.size());
        assertEquals("Honda", brands.get(0));
        assertEquals("Toyota", brands.get(1));
    }
}
