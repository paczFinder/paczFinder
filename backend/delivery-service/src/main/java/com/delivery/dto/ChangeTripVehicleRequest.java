package com.delivery.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ChangeTripVehicleRequest(
        @NotNull(message = "Vehicle ID is required")
        @Positive(message = "Vehicle ID must be greater than 0")
        Long vehicleId
) {
}
