package com.delivery.service;

import com.delivery.dto.CreateDeliveryRequest;
import com.delivery.dto.DeliveryResponse;
import com.delivery.entity.Delivery;
import com.delivery.enums.DeliveryStatus;
import com.delivery.repository.DeliveryRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.Collection;
import java.util.List;

@ApplicationScoped
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    public DeliveryService(DeliveryRepository deliveryRepository) {
        this.deliveryRepository = deliveryRepository;
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

        delivery.recipientName = request.recipientName();
        delivery.recipientPhone = request.recipientPhone();
        delivery.street = request.street();
        delivery.buildingNumber = request.buildingNumber();
        delivery.apartmentNumber = request.apartmentNumber();
        delivery.postalCode = request.postalCode();
        delivery.city = request.city();
        delivery.country = request.country();
        delivery.latitude = request.latitude().doubleValue();
        delivery.longitude = request.longitude().doubleValue();
        delivery.size = request.size();
        delivery.status = DeliveryStatus.ADDED;

        deliveryRepository.persist(delivery);

        return DeliveryResponse.from(delivery);
    }

    @Transactional
    public DeliveryResponse update(Long id, CreateDeliveryRequest request) {
        Delivery delivery = getDelivery(id);

        delivery.recipientName = request.recipientName();
        delivery.recipientPhone = request.recipientPhone();
        delivery.street = request.street();
        delivery.buildingNumber = request.buildingNumber();
        delivery.apartmentNumber = request.apartmentNumber();
        delivery.postalCode = request.postalCode();
        delivery.city = request.city();
        delivery.country = request.country();
        delivery.latitude = request.latitude().doubleValue();
        delivery.longitude = request.longitude().doubleValue();
        delivery.size = request.size();

        return DeliveryResponse.from(delivery);
    }

    public int calculateLoadUnits(Collection<Delivery> deliveries) {
        return deliveries.stream()
                .mapToInt(delivery -> delivery.size.getLoadUnits())
                .sum();
    }

    private Delivery getDelivery(Long id) {
        Delivery delivery = deliveryRepository.findById(id);

        if (delivery == null) {
            throw new NotFoundException("Delivery not found: " + id);
        }

        return delivery;
    }
}
