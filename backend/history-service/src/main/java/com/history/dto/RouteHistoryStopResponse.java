package com.history.dto;

import com.history.entity.RouteHistoryStop;

public record RouteHistoryStopResponse(
        Long id,
        Long routeHistoryId,
        Long deliveryId,
        Integer stopOrder,
        String address,
        Double latitude,
        Double longitude
) {
    public static RouteHistoryStopResponse from(RouteHistoryStop stop) {
        return new RouteHistoryStopResponse(
                stop.id,
                stop.routeHistory.id,
                stop.deliveryId,
                stop.stopOrder,
                stop.address,
                stop.latitude,
                stop.longitude
        );
    }
}

