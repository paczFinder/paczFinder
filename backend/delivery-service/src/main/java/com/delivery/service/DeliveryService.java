package com.delivery.service;

import com.delivery.dto.CreateDeliveryRequest;
import com.delivery.dto.DeliveryResponse;
import com.delivery.entity.Delivery;
import com.delivery.entity.Trip;
import com.delivery.enums.DeliveryStatus;
import com.delivery.repository.DeliveryRepository;
import com.delivery.repository.TripRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.Collection;
import java.util.List;

@ApplicationScoped
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final TripRepository tripRepository;

    public DeliveryService(DeliveryRepository deliveryRepository, TripRepository tripRepository) {
        this.deliveryRepository = deliveryRepository;
        this.tripRepository = tripRepository;
    }

    public List<DeliveryResponse> findAll() {
        return deliveryRepository.listAll()
                .stream()
                .map(DeliveryResponse::from)
                .toList();
    }

    public List<DeliveryResponse> findAvailable() {
        return deliveryRepository.list("status", DeliveryStatus.ADDED)
                .stream()
                .map(DeliveryResponse::from)
                .toList();
    }

    public DeliveryResponse findById(Long id) {
        return DeliveryResponse.from(getDelivery(id));
    }

    @Transactional
    public DeliveryResponse create(CreateDeliveryRequest request) {
        Delivery delivery = new Delivery();
        applyRequestToDelivery(delivery, request);
        delivery.status = DeliveryStatus.ADDED;

        deliveryRepository.persist(delivery);

        return DeliveryResponse.from(delivery);
    }

    @Transactional
    public DeliveryResponse update(Long id, CreateDeliveryRequest request) {
        Delivery delivery = getDelivery(id);

        if (delivery.status == DeliveryStatus.DELIVERED) {
            throw new BadRequestException("Cannot update a delivered delivery");
        }

        applyRequestToDelivery(delivery, request);

        return DeliveryResponse.from(delivery);
    }

    @Transactional
    public void delete(Long id) {
        Delivery delivery = getDelivery(id);

        List<Trip> trips = tripRepository.findByDeliveryId(id);

        for (Trip trip : trips) {
            trip.deliveries.remove(delivery);
        }

        deliveryRepository.delete(delivery);
    }

    private Delivery getDelivery(Long id) {
        Delivery delivery = deliveryRepository.findById(id);

        if (delivery == null) {
            throw new NotFoundException("Delivery not found: " + id);
        }

        return delivery;
    }

    private void applyRequestToDelivery(Delivery delivery, CreateDeliveryRequest request) {
        delivery.recipientName = request.recipientName().trim();
        delivery.recipientPhone = request.recipientPhone().trim();
        delivery.street = request.street().trim();
        delivery.buildingNumber = request.buildingNumber().trim();
        delivery.apartmentNumber = normalizeString(request.apartmentNumber());
        delivery.postalCode = request.postalCode().trim();
        delivery.city = request.city().trim();
        delivery.country = request.country().trim();
        delivery.latitude = request.latitude().doubleValue();
        delivery.longitude = request.longitude().doubleValue();
        delivery.size = request.size();
    }

    private String normalizeString(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
