package com.delivery.dto;

public record VehicleFilter(
        String search,
        Boolean active,
        Boolean hasCourier,
        String sort,
        String direction
) {
}
