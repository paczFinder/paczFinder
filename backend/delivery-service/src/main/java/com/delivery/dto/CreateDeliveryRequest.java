package com.delivery.dto;

import com.delivery.enums.DeliverySize;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateDeliveryRequest(
        @NotBlank(message = "Recipient name is required")
        @Size(max = 100, message = "Recipient name cannot exceed 100 characters")
        String recipientName,

        @NotBlank(message = "Recipient phone is required")
        @Size(max = 20, message = "Recipient phone cannot exceed 20 characters")
        String recipientPhone,

        @NotBlank(message = "Street is required")
        @Size(max = 100, message = "Street cannot exceed 100 characters")
        String street,

        @NotBlank(message = "Building number is required")
        @Size(max = 10, message = "Building number cannot exceed 10 characters")
        String buildingNumber,

        @Size(max = 10, message = "Apartment number cannot exceed 10 characters")
        String apartmentNumber,

        @NotBlank(message = "Postal code is required")
        @Size(max = 10, message = "Postal code cannot exceed 10 characters")
        String postalCode,

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City cannot exceed 100 characters")
        String city,

        @NotBlank(message = "Country is required")
        @Size(max = 60, message = "Country cannot exceed 60 characters")
        String country,

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        BigDecimal latitude,

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        BigDecimal longitude,

        @NotNull(message = "Size is required")
        DeliverySize size
) {
}
