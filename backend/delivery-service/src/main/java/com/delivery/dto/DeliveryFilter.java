package com.delivery.dto;

public record DeliveryFilter(
        String search,
        String status,
        String size,
        String sort,
        String direction
) {
}
