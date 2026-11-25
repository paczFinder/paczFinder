package org.example.routeoptimizationservice.algorithm;

public record Location(
        int id,
        double latitude,
        double longitude,
        int loadUnits
) {
}
