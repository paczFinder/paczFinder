package com.delivery.dto;

import com.delivery.enums.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDeliveryStatusRequest(
        @NotNull(message = "Status is required")
        DeliveryStatus status
) {
}

