package org.example.routeoptimizationservice.dto;

import java.util.List;

public record RouteRequestDto(
        List<PointDto> orderedPoints
) {
}
