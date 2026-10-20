package com.delivery.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

import com.delivery.enums.DeliverySize;

public record CreateDeliveryRequest(
        @NotBlank @Size(max = 100)
        String recipientName,

        @NotBlank @Size(max = 20)
        String recipientPhone,

        @NotBlank @Size(max = 100)
        String street,

        @NotBlank @Size(max = 10)
        String buildingNumber,

        @Size(max = 10)
        String apartmentNumber,

        @NotBlank @Size(max = 10)
        String postalCode,

        @NotBlank @Size(max = 100)
        String city,

        @NotBlank @Size(max = 60)
        String country,

        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0")
        BigDecimal latitude,

        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0")
        BigDecimal longitude,

        @NotNull
        DeliverySize size
) {
}
