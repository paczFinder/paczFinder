package com.delivery.dto;

import com.delivery.entity.Delivery;
import com.delivery.enums.DeliverySize;
import com.delivery.enums.DeliveryStatus;

public record DeliveryResponse(
        Long id,
        String recipientName,
        String recipientPhone,
        String street,
        String buildingNumber,
        String apartmentNumber,
        String postalCode,
        String city,
        String country,
        Double latitude,
        Double longitude,
        DeliverySize size,
        DeliveryStatus status
) {
    public static DeliveryResponse from(Delivery delivery) {
        return new DeliveryResponse(
                delivery.id,
                delivery.recipientName,
                delivery.recipientPhone,
                delivery.street,
                delivery.buildingNumber,
                delivery.apartmentNumber,
                delivery.postalCode,
                delivery.city,
                delivery.country,
                delivery.latitude,
                delivery.longitude,
                delivery.size,
                delivery.status
        );
    }
}
