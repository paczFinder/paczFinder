package org.example.routeoptimizationservice.dto;

import java.util.List;

public record DeliveryDto(
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
        String size,
        String status
) {
}
