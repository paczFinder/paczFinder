package com.delivery.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignCourierRequest(
        @NotBlank(message = "Courier keycloak user ID cannot be blank")
        String keycloakUserId
) {
}
