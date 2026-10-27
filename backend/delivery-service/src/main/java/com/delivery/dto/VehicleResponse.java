package com.delivery.dto;

import com.delivery.entity.Vehicle;

public record VehicleResponse(
        Long id,
        String brand,
        String model,
        String registrationNumber,
        Integer capacity,
        boolean active,
        String courierKeycloakId
) {
    public static VehicleResponse from(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.id,
                vehicle.brand,
                vehicle.model,
                vehicle.registrationNumber,
                vehicle.capacity,
                vehicle.active,
                vehicle.courierKeycloakId
        );
    }
}
