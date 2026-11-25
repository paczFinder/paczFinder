package org.example.routeoptimizationservice.dto;

import java.time.Instant;
import java.util.List;

public record RouteHistoryResponse(
        Long id,
        Long sourceRoutePlanId,
        Long tripId,
        Long totalDistanceM,
        Long drivingTimeS,
        Long serviceTimeS,
        Long totalTimeS,
        Instant calculatedAt,
        List<RouteHistoryStopResponse> stops
) {
    public record RouteHistoryStopResponse(
            Long id,
            Long routeHistoryId,
            Long deliveryId,
            Integer stopOrder,
            String address,
            Double latitude,
            Double longitude
    ) {
    }
}
