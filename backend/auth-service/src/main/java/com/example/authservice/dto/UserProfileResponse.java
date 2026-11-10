package com.example.authservice.dto;
import com.example.authservice.model.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String name,
        String surname,
        String email,
        UserRole role,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {}