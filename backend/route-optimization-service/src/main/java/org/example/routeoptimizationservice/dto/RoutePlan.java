package org.example.routeoptimizationservice.dto;

import java.util.List;

public record RoutePlan(
        Long vehicleId,
        String vehicleRegistrationNumber,
        List<Long> deliveryIdsInOrder,
        double totalDistanceMeters,
        double totalDurationSeconds,
        double fuelLiters
) {
}
