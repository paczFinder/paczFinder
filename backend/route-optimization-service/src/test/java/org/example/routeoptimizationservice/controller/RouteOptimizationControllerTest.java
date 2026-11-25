package org.example.routeoptimizationservice.controller;

import org.example.routeoptimizationservice.dto.OptimizationCriterion;
import org.example.routeoptimizationservice.dto.OptimizationRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RouteOptimizationControllerTest {

    @Test
    void optimizationRequestShouldAcceptValidInput() {
        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122,
                List.of(1L, 2L),
                List.of(1L),
                OptimizationCriterion.DISTANCE,
                8.0
        );
        assertEquals(52.2297, request.depotLatitude());
        assertEquals(21.0122, request.depotLongitude());
        assertEquals(List.of(1L, 2L), request.deliveryIds());
        assertEquals(List.of(1L), request.vehicleIds());
        assertEquals(OptimizationCriterion.DISTANCE, request.criterion());
        assertEquals(8.0, request.fuelConsumptionLitersPer100km());
    }

    @Test
    void optimizationRequestShouldHandleEmptyLists() {
        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122,
                List.of(), List.of(),
                OptimizationCriterion.TIME,
                6.5
        );
        assertTrue(request.deliveryIds().isEmpty());
        assertTrue(request.vehicleIds().isEmpty());
    }
}
