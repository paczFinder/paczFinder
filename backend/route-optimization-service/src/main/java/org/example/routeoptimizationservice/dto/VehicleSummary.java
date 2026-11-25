package org.example.routeoptimizationservice.dto;

public record VehicleSummary(
        Long id,
        String brand,
        String model,
        String registrationNumber,
        int capacity,
        boolean active,
        String courierKeycloakId
) {
}
