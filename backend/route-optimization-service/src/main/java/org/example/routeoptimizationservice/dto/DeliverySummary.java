package org.example.routeoptimizationservice.dto;

import java.util.List;

public record DeliverySummary(
        Long id,
        String recipientName,
        double latitude,
        double longitude,
        int loadUnits
) {
}
