package com.history.dto;

import com.history.entity.RouteHistory;

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
    public static RouteHistoryResponse from(RouteHistory routeHistory) {
        return new RouteHistoryResponse(
                routeHistory.id,
                routeHistory.sourceRoutePlanId,
                routeHistory.tripId,
                routeHistory.totalDistanceM,
                routeHistory.drivingTimeS,
                routeHistory.serviceTimeS,
                routeHistory.totalTimeS,
                routeHistory.calculatedAt,
                routeHistory.stops.stream()
                        .map(RouteHistoryStopResponse::from)
                        .toList()
        );
    }
}

