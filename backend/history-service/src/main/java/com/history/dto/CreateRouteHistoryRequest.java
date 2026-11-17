package com.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateRouteHistoryRequest(
        @NotNull(message = "Source route plan ID is required")
        @Positive(message = "Source route plan ID must be greater than 0")
        Long sourceRoutePlanId,

        @NotNull(message = "Trip ID is required")
        @Positive(message = "Trip ID must be greater than 0")
        Long tripId,

        @NotNull(message = "Total distance is required")
        @Positive(message = "Total distance must be greater than 0")
        Long totalDistanceM,

        @NotNull(message = "Driving time is required")
        @Positive(message = "Driving time must be greater than 0")
        Long drivingTimeS,

        @NotNull(message = "Service time is required")
        @Positive(message = "Service time must be greater than 0")
        Long serviceTimeS,

        @NotNull(message = "Total time is required")
        @Positive(message = "Total time must be greater than 0")
        Long totalTimeS,

        @NotNull(message = "Stops are required")
        @NotEmpty(message = "Stops cannot be empty")
        @Valid
        List<CreateRouteHistoryStopRequest> stops
) {
}
