package com.delivery.dto;

import com.delivery.entity.Trip;
import com.delivery.enums.TripStatus;

public record TripResponse(
        Long id,
        Long vehicleId,
        String vehicleBrand,
        String vehicleModel,
        String registrationNumber,
        Integer vehicleCapacity,
        String courierKeycloakId,
        int deliveryCount,
        int usedCapacity,
        TripStatus status
) {
    public static TripResponse from(Trip trip) {
        int usedCapacity = trip.deliveries.stream()
                .mapToInt(delivery -> delivery.size.getLoadUnits())
                .sum();

        return new TripResponse(
                trip.id,
                trip.vehicle.id,
                trip.vehicle.brand,
                trip.vehicle.model,
                trip.vehicle.registrationNumber,
                trip.vehicle.capacity,
                trip.vehicle.courierKeycloakId,
                trip.deliveries.size(),
                usedCapacity,
                trip.status
        );
    }
}
