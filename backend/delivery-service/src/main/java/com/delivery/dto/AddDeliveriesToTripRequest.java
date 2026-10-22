package com.delivery.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record AddDeliveriesToTripRequest(
        @NotEmpty(message = "Delivery IDs list cannot be empty")
        List<@NotNull(message = "Delivery ID cannot be null") @Positive(message = "Delivery ID must be greater than 0") Long> deliveryIds
) {
}
