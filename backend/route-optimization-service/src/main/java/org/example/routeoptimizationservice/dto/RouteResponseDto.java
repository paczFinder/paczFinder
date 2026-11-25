package org.example.routeoptimizationservice.dto;

import java.util.List;

public record RouteResponseDto(
        long totalDistanceMeters,
        long totalDurationSeconds,
        Geometry geometry
) {
    public record Geometry(String type, List<List<Double>> coordinates) {}
}
