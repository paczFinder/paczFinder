package org.example.routeoptimizationservice.dto;

public record VehicleDto(
        Long id,
        String brand,
        String model,
        String registrationNumber,
        Integer capacity,
        boolean active,
        String courierKeycloakId
) {
}
