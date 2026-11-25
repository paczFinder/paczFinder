package org.example.routeoptimizationservice.dto;

import java.util.List;

public record OptimizationResult(
        List<RoutePlan> routes,
        double totalDistanceMeters,
        double totalDurationSeconds,
        double totalFuelLiters,
        OptimizationCriterion criterion
) {
}
