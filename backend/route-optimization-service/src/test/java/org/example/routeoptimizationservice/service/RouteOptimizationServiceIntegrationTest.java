package org.example.routeoptimizationservice.service;

import org.example.routeoptimizationservice.algorithm.AntColonyOptimizer;
import org.example.routeoptimizationservice.algorithm.BruteForceOptimizer;
import org.example.routeoptimizationservice.algorithm.Location;
import org.example.routeoptimizationservice.algorithm.SimulatedAnnealingOptimizer;
import org.example.routeoptimizationservice.client.DeliveryClient;
import org.example.routeoptimizationservice.client.HistoryClient;
import org.example.routeoptimizationservice.client.RoutingClient;
import org.example.routeoptimizationservice.dto.DeliveryDto;
import org.example.routeoptimizationservice.dto.MatrixResponse;
import org.example.routeoptimizationservice.dto.OptimizationCriterion;
import org.example.routeoptimizationservice.dto.OptimizationRequest;
import org.example.routeoptimizationservice.dto.OptimizationResult;
import org.example.routeoptimizationservice.dto.PointDto;
import org.example.routeoptimizationservice.dto.RoutePlan;
import org.example.routeoptimizationservice.dto.RouteResponseDto;
import org.example.routeoptimizationservice.dto.VehicleDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Integration test for RouteOptimizationService.
 * Tests the full end-to-end flow: external clients (delivery, routing, history)
 * are mocked, but the service logic, cost-matrix building, ACO invocation,
 * fuel computation, and history persistence are all exercised together.
 */
class RouteOptimizationServiceIntegrationTest {

    private DeliveryClient deliveryClient;
    private RoutingClient routingClient;
    private HistoryClient historyClient;
    private AntColonyOptimizer optimizer;
    private SimulatedAnnealingOptimizer annealingOptimizer;
    private BruteForceOptimizer bruteForceOptimizer;
    private RouteOptimizationService service;

    @BeforeEach
    void setUp() {
        deliveryClient = mock(DeliveryClient.class);
        routingClient = mock(RoutingClient.class);
        historyClient = mock(HistoryClient.class);
        optimizer = mock(AntColonyOptimizer.class);
        annealingOptimizer = mock(SimulatedAnnealingOptimizer.class);
        bruteForceOptimizer = mock(BruteForceOptimizer.class);
        service = new RouteOptimizationService(deliveryClient, routingClient, historyClient, optimizer, annealingOptimizer,
                bruteForceOptimizer);
    }

    @Test
    void endToEndOptimizeDistanceCriterionReturnsCompleteResult() {
        // given
        DeliveryDto d1 = new DeliveryDto(1L, "Jan Kowalski", "123456789", "ul. Testowa", "10", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        DeliveryDto d2 = new DeliveryDto(2L, "Anna Nowak", "987654321", "ul. Krucza", "5", null,
                "00-002", "Kraków", "PL", 52.2300, 21.0125, "M", "ADDED");
        VehicleDto vehicle = new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "courier-1");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(d1, d2));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(vehicle));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1", "2"),
                List.of(List.of(0.0, 60.0, 120.0), List.of(60.0, 0.0, 90.0), List.of(120.0, 90.0, 0.0)),
                List.of(List.of(0, 1000, 2000), List.of(1000, 0, 1500), List.of(2000, 1500, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(routingClient.route(any())).thenReturn(new RouteResponseDto(3500L, 315L,
                new RouteResponseDto.Geometry("LineString", List.of(List.of(21.0122, 52.2297)))));
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class)))
                .thenReturn(new org.example.routeoptimizationservice.algorithm.Solution(List.of(List.of(1, 2)), 450.0));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L, 2L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        OptimizationResult result = service.optimizeSync(request);

        // then — full result
        assertThat(result).isNotNull();
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.DISTANCE);
        assertThat(result.routes()).hasSize(1);
        RoutePlan plan = result.routes().get(0);
        assertThat(plan.vehicleId()).isEqualTo(10L);
        assertThat(plan.vehicleRegistrationNumber()).isEqualTo("WA 12345");
        assertThat(plan.deliveryIdsInOrder()).containsExactly(1L, 2L);
        assertThat(plan.totalDistanceMeters()).isEqualTo(3500.0);
        assertThat(plan.totalDurationSeconds()).isEqualTo(315.0);
        assertThat(plan.fuelLiters()).isEqualTo(3500.0 / 1000.0 * 8.0 / 100.0);
        assertThat(result.totalDistanceMeters()).isEqualTo(3500.0);
        assertThat(result.totalDurationSeconds()).isEqualTo(315.0);
        assertThat(result.totalFuelLiters()).isEqualTo(plan.fuelLiters());

        // history persisted
        verify(historyClient).create(any());
    }

    @Test
    void endToEndOptimizeFuelCriterionComputesFuelCorrectly() {
        // given
        DeliveryDto delivery = new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        VehicleDto vehicle = new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(delivery));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(vehicle));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1"),
                List.of(List.of(0.0, 60.0), List.of(60.0, 0.0)),
                List.of(List.of(0, 1000), List.of(1000, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(routingClient.route(any())).thenReturn(new RouteResponseDto(10000L, 900L,
                new RouteResponseDto.Geometry("LineString", List.of())));
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class)))
                .thenReturn(new org.example.routeoptimizationservice.algorithm.Solution(List.of(List.of(1)), 120.0));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.FUEL, 10.0
        );

        // when
        OptimizationResult result = service.optimizeSync(request);

        // then
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.FUEL);
        assertThat(result.totalFuelLiters()).isEqualTo(10000.0 / 1000.0 * 10.0 / 100.0);
        assertThat(result.routes().get(0).fuelLiters()).isEqualTo(result.totalFuelLiters());
    }

    @Test
    void endToEndOptimizeTimeCriterionOptimizesByTime() {
        // given
        DeliveryDto delivery = new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        VehicleDto vehicle = new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(delivery));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(vehicle));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1"),
                List.of(List.of(0.0, 60.0), List.of(60.0, 0.0)),
                List.of(List.of(0, 1000), List.of(1000, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(routingClient.route(any())).thenReturn(new RouteResponseDto(2000L, 120L,
                new RouteResponseDto.Geometry("LineString", List.of())));
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class)))
                .thenReturn(new org.example.routeoptimizationservice.algorithm.Solution(List.of(List.of(1)), 120.0));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.TIME, 8.0
        );

        // when
        OptimizationResult result = service.optimizeSync(request);

        // then
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.TIME);
        assertThat(result.totalDurationSeconds()).isEqualTo(120.0);
    }

    @Test
    void endToEndOptimizeMultipleVehiclesCreatesMultipleRoutesAndHistoryEntries() {
        // given
        DeliveryDto d1 = new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        DeliveryDto d2 = new DeliveryDto(2L, "Anna", "456", "ul. Test2", "2", null,
                "00-002", "Kraków", "PL", 52.2300, 21.0125, "M", "ADDED");
        VehicleDto v1 = new VehicleDto(10L, "Toyota", "Corolla", "WA 11111", 10, true, "c1");
        VehicleDto v2 = new VehicleDto(20L, "Ford", "Focus", "WA 22222", 10, true, "c2");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(d1, d2));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(v1, v2));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1", "2"),
                List.of(List.of(0.0, 60.0, 120.0), List.of(60.0, 0.0, 90.0), List.of(120.0, 90.0, 0.0)),
                List.of(List.of(0, 1000, 2000), List.of(1000, 0, 1500), List.of(2000, 1500, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(routingClient.route(any())).thenReturn(new RouteResponseDto(3500L, 315L,
                new RouteResponseDto.Geometry("LineString", List.of())));
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class)))
                .thenReturn(new org.example.routeoptimizationservice.algorithm.Solution(
                        List.of(List.of(1), List.of(2)), 450.0));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L, 2L), List.of(10L, 20L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        OptimizationResult result = service.optimizeSync(request);

        // then
        assertThat(result.routes()).hasSize(2);
        assertThat(result.totalDistanceMeters()).isEqualTo(7000.0);
        assertThat(result.totalFuelLiters()).isEqualTo(7000.0 / 1000.0 * 8.0 / 100.0);

        // history saved for each vehicle route
        verify(historyClient, org.mockito.Mockito.times(2)).create(any());
    }

    @Test
    void endToEndOptimizeThrowsWhenNoDeliveries() {
        // given
        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of());
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(
                new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1")));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when / then
        assertThatThrownBy(() -> service.optimizeSync(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No valid deliveries found");
    }

    @Test
    void endToEndOptimizeThrowsWhenNoVehicles() {
        // given
        DeliveryDto delivery = new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(delivery));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of());

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when / then
        assertThatThrownBy(() -> service.optimizeSync(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No valid vehicles found");
    }

    @Test
    void endToEndOptimizeDoesNotSaveHistoryWhenNoRoutes() {
        // given
        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(
                new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null, "00-001", "Warszawa", "PL",
                        52.2297, 21.0122, "S", "ADDED")));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(
                new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1")));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1"),
                List.of(List.of(0.0, 60.0), List.of(60.0, 0.0)),
                List.of(List.of(0, 1000), List.of(1000, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class)))
                .thenReturn(new org.example.routeoptimizationservice.algorithm.Solution(List.of(), 0.0));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        service.optimize(request);

        // then — no history entry created when no routes
        verify(historyClient, org.mockito.Mockito.never()).create(any());
    }

    @Test
    void integrationWithRealAntColonyOptimizerProducesValidRoutes() {
        // given — real ACO, mocked external clients
        DeliveryDto d1 = new DeliveryDto(1L, "A", "1", "ul. A", "1", null, "00-001", "Warszawa", "PL",
                52.2297, 21.0122, "S", "ADDED");
        DeliveryDto d2 = new DeliveryDto(2L, "B", "2", "ul. B", "2", null, "00-002", "Kraków", "PL",
                52.2300, 21.0125, "S", "ADDED");
        VehicleDto vehicle = new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(d1, d2));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(vehicle));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1", "2"),
                List.of(List.of(0.0, 100.0, 200.0), List.of(100.0, 0.0, 150.0), List.of(200.0, 150.0, 0.0)),
                List.of(List.of(0, 1000, 2000), List.of(1000, 0, 1500), List.of(2000, 1500, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(routingClient.route(any())).thenReturn(new RouteResponseDto(3500L, 315L,
                new RouteResponseDto.Geometry("LineString", List.of())));
        // use a real AntColonyOptimizer instance
        AntColonyOptimizer realOptimizer = new AntColonyOptimizer(42L);
        RouteOptimizationService realService = new RouteOptimizationService(
                deliveryClient, routingClient, historyClient, realOptimizer, annealingOptimizer, bruteForceOptimizer);

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L, 2L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        OptimizationResult result = realService.optimizeSync(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.DISTANCE);
        assertThat(result.totalDistanceMeters()).isPositive();
        assertThat(result.totalDurationSeconds()).isPositive();
        assertThat(result.totalFuelLiters()).isPositive();
        assertThat(result.routes()).isNotEmpty();
        assertThat(result.routes().get(0).deliveryIdsInOrder()).containsExactlyInAnyOrder(1L, 2L);
        // history persisted
        verify(historyClient).create(any());
    }
}
