package com.delivery.service;

import com.delivery.dto.AddDeliveriesToTripRequest;
import com.delivery.dto.AddDeliveryToTripRequest;
import com.delivery.dto.ChangeTripVehicleRequest;
import com.delivery.dto.CreateTripRequest;
import com.delivery.dto.DeliveryResponse;
import com.delivery.dto.PaginatedResponse;
import com.delivery.dto.TripResponse;
import com.delivery.entity.Delivery;
import com.delivery.entity.Trip;
import com.delivery.entity.Vehicle;
import com.delivery.enums.DeliveryStatus;
import com.delivery.enums.TripStatus;
import com.delivery.repository.DeliveryRepository;
import com.delivery.repository.TripRepository;
import com.delivery.repository.VehicleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DeliveryRepository deliveryRepository;

    public TripService(
            TripRepository tripRepository,
            VehicleRepository vehicleRepository,
            DeliveryRepository deliveryRepository
    ) {
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.deliveryRepository = deliveryRepository;
    }

    public PaginatedResponse<TripResponse> findAll(int page, int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = Math.max(size, 1);

        List<Trip> trips = tripRepository.findPaginated(pageIndex, pageSize);
        long totalElements = tripRepository.count();
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);

        return new PaginatedResponse<>(
                trips.stream()
                        .map(TripResponse::from)
                        .toList(),
                totalElements,
                pageIndex,
                pageSize,
                totalPages
        );
    }

    public TripResponse findById(Long id) {
        return TripResponse.from(getTrip(id));
    }

    @Transactional
    public List<DeliveryResponse> findDeliveries(Long tripId) {
        Trip trip = getTrip(tripId);

        return trip.deliveries.stream()
                .map(DeliveryResponse::from)
                .toList();
    }

    @Transactional
    public TripResponse create(CreateTripRequest request) {
        Vehicle vehicle = getActiveVehicle(request.vehicleId());

        Trip trip = new Trip();
        trip.vehicle = vehicle;
        trip.status = TripStatus.ADDED;

        tripRepository.persist(trip);

        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse addDelivery(Long tripId, AddDeliveryToTripRequest request) {
        Trip trip = getTrip(tripId);
        validateTripIsActive(trip);

        Delivery delivery = getAvailableDelivery(request.deliveryId());

        int currentLoad = calculateLoad(trip.deliveries);
        int newLoad = currentLoad + delivery.size.getLoadUnits();
        validateCapacity(trip.vehicle, newLoad);

        trip.deliveries.add(delivery);
        delivery.status = DeliveryStatus.IN_DELIVERY;

        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse addDeliveries(Long tripId, AddDeliveriesToTripRequest request) {
        Trip trip = getTrip(tripId);
        validateTripIsActive(trip);

        Set<Long> uniqueIds = new HashSet<>(request.deliveryIds());

        if (uniqueIds.size() != request.deliveryIds().size()) {
            throw new BadRequestException("Duplicate delivery IDs are not allowed");
        }

        List<Delivery> deliveriesToAdd = uniqueIds.stream()
                .map(this::getAvailableDelivery)
                .toList();

        int currentLoad = calculateLoad(trip.deliveries);
        int additionalLoad = calculateLoad(deliveriesToAdd);
        validateCapacity(trip.vehicle, currentLoad + additionalLoad);

        for (Delivery delivery : deliveriesToAdd) {
            trip.deliveries.add(delivery);
            delivery.status = DeliveryStatus.IN_DELIVERY;
        }

        return TripResponse.from(trip);
    }

    @Transactional
    public TripResponse changeVehicle(
            Long tripId,
            ChangeTripVehicleRequest request
    ) {
        Trip trip = getTrip(tripId);
        validateTripIsActive(trip);

        Vehicle vehicle = getActiveVehicle(request.vehicleId());

        int currentLoad = calculateLoad(trip.deliveries);
        validateCapacity(vehicle, currentLoad);

        trip.vehicle = vehicle;

        return TripResponse.from(trip);
    }

    @Transactional
    public void delete(Long tripId) {
        Trip trip = getTrip(tripId);

        for (Delivery delivery : trip.deliveries) {
            delivery.status = DeliveryStatus.ADDED;
        }

        trip.deliveries.clear();
        tripRepository.delete(trip);
    }

    @Transactional
    public TripResponse finish(Long tripId) {
        Trip trip = getTrip(tripId);

        if (trip.status == TripStatus.FINISHED) {
            throw new BadRequestException("Trip is already finished");
        }

        if (trip.deliveries.isEmpty()) {
            throw new BadRequestException("Cannot finish a trip without deliveries");
        }

        for (Delivery delivery : trip.deliveries) {
            if (delivery.status != DeliveryStatus.IN_DELIVERY) {
                throw new BadRequestException("Delivery " + delivery.id + " is not in delivery");
            }
        }

        for (Delivery delivery : trip.deliveries) {
            delivery.status = DeliveryStatus.DELIVERED;
        }

        trip.status = TripStatus.FINISHED;

        return TripResponse.from(trip);
    }

    private Trip getTrip(Long id) {
        Trip trip = tripRepository.findById(id);

        if (trip == null) {
            throw new NotFoundException("Trip not found: " + id);
        }

        return trip;
    }

    private Vehicle getActiveVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId);

        if (vehicle == null) {
            throw new NotFoundException("Vehicle not found: " + vehicleId);
        }

        if (!vehicle.active) {
            throw new BadRequestException("Vehicle is inactive");
        }

        return vehicle;
    }

    private Delivery getAvailableDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId);

        if (delivery == null) {
            throw new NotFoundException("Delivery not found: " + deliveryId);
        }

        if (delivery.status != DeliveryStatus.ADDED) {
            throw new BadRequestException(
                    "Delivery " + deliveryId + " is not available (status: " + delivery.status + ")"
            );
        }

        return delivery;
    }

    private int calculateLoad(Collection<Delivery> deliveries) {
        return deliveries.stream()
                .mapToInt(delivery -> delivery.size.getLoadUnits())
                .sum();
    }

    private void validateCapacity(Vehicle vehicle, int requestedLoad) {
        if (requestedLoad > vehicle.capacity) {
            throw new BadRequestException(
                    "Vehicle capacity exceeded. Capacity: "
                            + vehicle.capacity
                            + ", requested load: "
                            + requestedLoad
            );
        }
    }

    private void validateTripIsActive(Trip trip) {
        if (trip.status == TripStatus.FINISHED) {
            throw new BadRequestException("Cannot modify a finished trip");
        }
    }
}
