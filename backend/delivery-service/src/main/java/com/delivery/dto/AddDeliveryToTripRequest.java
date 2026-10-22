package com.delivery.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AddDeliveryToTripRequest(
        @NotNull(message = "Delivery ID is required")
        @Positive(message = "Delivery ID must be greater than 0")
        Long deliveryId
) {
}
