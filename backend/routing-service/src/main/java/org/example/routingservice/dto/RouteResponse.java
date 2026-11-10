package org.example.routingservice.dto;

import java.util.List;

public record RouteResponse(long totalDistanceMeters, long totalDurationSeconds, Geometry geometry) {

    public record Geometry(String type, List<List<Double>> coordinates) {}
}
