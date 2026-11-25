package com.delivery.dto;

public record TripFilter(
        String search,
        String status,
        String sort,
        String direction
) {
}
