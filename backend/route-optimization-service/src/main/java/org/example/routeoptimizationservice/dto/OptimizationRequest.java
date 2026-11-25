package org.example.routeoptimizationservice.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record OptimizationRequest(
        @NotNull(message = "Depot latitude is required")
        Double depotLatitude,

        @NotNull(message = "Depot longitude is required")
        Double depotLongitude,

        @NotEmpty(message = "Delivery IDs cannot be empty")
        List<@NotNull(message = "Delivery ID cannot be null") Long> deliveryIds,

        @NotEmpty(message = "Vehicle IDs cannot be empty")
        List<@NotNull(message = "Vehicle ID cannot be null") Long> vehicleIds,

        @NotNull(message = "Optimization criterion is required")
        OptimizationCriterion criterion,

        @Positive(message = "Fuel consumption must be greater than 0")
        Double fuelConsumptionLitersPer100km
) {
}
