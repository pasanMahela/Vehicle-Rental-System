package com.orchid.vehicle.service;

import com.orchid.vehicle.client.BookingClient;
import com.orchid.vehicle.dto.VehicleDTO;
import com.orchid.vehicle.model.Vehicle;
import com.orchid.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final BookingClient bookingClient;

    public Vehicle addVehicle(VehicleDTO dto) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(dto.getVehicleId());
        vehicle.setBrand(dto.getBrand());
        vehicle.setModel(dto.getModel());
        vehicle.setType(dto.getType());
        vehicle.setPricePerDay(dto.getPricePerDay());
        vehicle.setAdvanceDeposit(dto.getAdvanceDeposit());
        vehicle.setAvailabilityStatus(Vehicle.AvailabilityStatus.AVAILABLE);
        return vehicleRepository.save(vehicle);
    }

    public Vehicle updateVehicle(String id, VehicleDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicle.setBrand(dto.getBrand());
        vehicle.setModel(dto.getModel());
        vehicle.setType(dto.getType());
        vehicle.setPricePerDay(dto.getPricePerDay());
        vehicle.setAdvanceDeposit(dto.getAdvanceDeposit());
        if (dto.getAvailabilityStatus() != null) {
            vehicle.setAvailabilityStatus(Vehicle.AvailabilityStatus.valueOf(dto.getAvailabilityStatus()));
        }
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(String id) {
        if (!vehicleRepository.existsById(id)) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }
        vehicleRepository.deleteById(id);
    }

    public Vehicle getVehicleById(String id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle updateVehicleStatus(String id, String status) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicle.setAvailabilityStatus(Vehicle.AvailabilityStatus.valueOf(status));
        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByAvailabilityStatus(Vehicle.AvailabilityStatus.AVAILABLE);
    }

    public List<String> getDistinctBrands() {
        return vehicleRepository.findAll().stream()
                .map(Vehicle::getBrand)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getDistinctTypes() {
        return vehicleRepository.findAll().stream()
                .map(Vehicle::getType)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<Vehicle> getVehiclesRanked() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        Map<String, Long> counts = bookingClient.getBookingCountsByVehicle();

        vehicles.forEach(v -> v.setBookingCount(
                counts.getOrDefault(v.getVehicleId(), 0L).intValue()));

        vehicles.sort(Comparator.comparingInt(Vehicle::getBookingCount).reversed());

        int rank = 1;
        for (int i = 0; i < vehicles.size(); i++) {
            if (i > 0 && vehicles.get(i).getBookingCount() < vehicles.get(i - 1).getBookingCount()) {
                rank = i + 1;
            }
            vehicles.get(i).setPopularityRank(rank);
        }

        return vehicles;
    }
}
