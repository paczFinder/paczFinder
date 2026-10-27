package com.delivery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateVehicleRequest(
        @NotBlank(message = "Brand is required")
        @Size(max = 50, message = "Brand cannot exceed 50 characters")
        String brand,

        @NotBlank(message = "Model is required")
        @Size(max = 50, message = "Model cannot exceed 50 characters")
        String model,

        @NotBlank(message = "Registration number is required")
        @Size(max = 10, message = "Registration number cannot exceed 10 characters")
        String registrationNumber,

        @NotNull(message = "Capacity is required")
        @Positive(message = "Capacity must be greater than 0")
        Integer capacity,

        @Size(max = 255, message = "Courier Keycloak ID cannot exceed 255 characters")
        String courierKeycloakId
) {
}
