package com.delivery.service;

import com.delivery.dto.AssignCourierRequest;
import com.delivery.dto.CreateVehicleRequest;
import com.delivery.dto.VehicleResponse;
import com.delivery.entity.Vehicle;
import com.delivery.repository.TripRepository;
import com.delivery.repository.VehicleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    public VehicleService(VehicleRepository vehicleRepository, TripRepository tripRepository) {
        this.vehicleRepository = vehicleRepository;
        this.tripRepository = tripRepository;
    }

    public List<VehicleResponse> findAll() {
        return vehicleRepository.listAll()
                .stream()
                .map(VehicleResponse::from)
                .toList();
    }

    public VehicleResponse findById(Long id) {
        Vehicle vehicle = getVehicle(id);
        return VehicleResponse.from(vehicle);
    }

    @Transactional
    public VehicleResponse create(CreateVehicleRequest request) {
        validateRegistrationNumberUnique(request.registrationNumber(), null);

        Vehicle vehicle = new Vehicle();
        vehicle.brand = request.brand().trim();
        vehicle.model = request.model().trim();
        vehicle.registrationNumber = request.registrationNumber().trim();
        vehicle.capacity = request.capacity();
        vehicle.active = true;
        vehicle.courierKeycloakId = normalizeString(request.courierKeycloakId());

        vehicleRepository.persist(vehicle);

        return VehicleResponse.from(vehicle);
    }

    @Transactional
    public VehicleResponse update(Long id, CreateVehicleRequest request) {
        Vehicle vehicle = getVehicle(id);

        validateRegistrationNumberUnique(request.registrationNumber(), id);

        vehicle.brand = request.brand().trim();
        vehicle.model = request.model().trim();
        vehicle.capacity = request.capacity();
        vehicle.registrationNumber = request.registrationNumber().trim();
        vehicle.courierKeycloakId = normalizeString(request.courierKeycloakId());

        return VehicleResponse.from(vehicle);
    }

    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = getVehicle(id);

        if (tripRepository.count("vehicle", vehicle) > 0) {
            throw new BadRequestException("Cannot delete a vehicle assigned to trips");
        }

        vehicleRepository.delete(vehicle);
    }

    @Transactional
    public void deactivate(Long id) {
        Vehicle vehicle = getVehicle(id);
        vehicle.active = false;
    }

    @Transactional
    public void activate(Long id) {
        Vehicle vehicle = getVehicle(id);
        vehicle.active = true;
    }

    @Transactional
    public VehicleResponse assignCourier(Long id, AssignCourierRequest request) {
        Vehicle vehicle = getVehicle(id);

        if (!vehicle.active) {
            throw new BadRequestException("Cannot assign courier to an inactive vehicle");
        }

        vehicle.courierKeycloakId = normalizeString(request.keycloakUserId());
        return VehicleResponse.from(vehicle);
    }

    @Transactional
    public VehicleResponse unassignCourier(Long id) {
        Vehicle vehicle = getVehicle(id);
        vehicle.courierKeycloakId = null;
        return VehicleResponse.from(vehicle);
    }

    private Vehicle getVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id);

        if (vehicle == null) {
            throw new NotFoundException("Vehicle not found: " + id);
        }

        return vehicle;
    }

    private void validateRegistrationNumberUnique(String registrationNumber, Long excludeId) {
        String trimmedRegNumber = registrationNumber.trim();
        var query = excludeId == null
                ? vehicleRepository.find("registrationNumber", trimmedRegNumber)
                : vehicleRepository.find("registrationNumber = ?1 and id != ?2", trimmedRegNumber, excludeId);

        if (query.firstResultOptional().isPresent()) {
            throw new BadRequestException("Vehicle with registration number '" + trimmedRegNumber + "' already exists");
        }
    }

    private String normalizeString(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
