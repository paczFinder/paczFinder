package org.example.routeoptimizationservice.service;

import org.example.routeoptimizationservice.algorithm.AntColonyOptimizer;
import org.example.routeoptimizationservice.algorithm.Location;
import org.example.routeoptimizationservice.client.DeliveryClient;
import org.example.routeoptimizationservice.client.HistoryClient;
import org.example.routeoptimizationservice.client.RoutingClient;
import org.example.routeoptimizationservice.dto.CreateRouteHistoryRequest;
import org.example.routeoptimizationservice.dto.CreateRouteHistoryStopRequest;
import org.example.routeoptimizationservice.dto.DeliveryDto;
import org.example.routeoptimizationservice.dto.MatrixResponse;
import org.example.routeoptimizationservice.dto.OptimizationCriterion;
import org.example.routeoptimizationservice.dto.OptimizationRequest;
import org.example.routeoptimizationservice.dto.OptimizationResult;
import org.example.routeoptimizationservice.dto.PointDto;
import org.example.routeoptimizationservice.dto.RouteHistoryResponse;
import org.example.routeoptimizationservice.dto.RoutePlan;
import org.example.routeoptimizationservice.dto.RouteResponseDto;
import org.example.routeoptimizationservice.dto.VehicleDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteOptimizationServiceUnitTest {

    @Mock
    private DeliveryClient deliveryClient;

    @Mock
    private RoutingClient routingClient;

    @Mock
    private HistoryClient historyClient;

    @Mock
    private AntColonyOptimizer optimizer;

    private RouteOptimizationService service;

    @BeforeEach
    void setUp() {
        service = new RouteOptimizationService(deliveryClient, routingClient, historyClient, optimizer);
    }

    @Test
    void shouldOptimizeByDistanceAndReturnResult() {
        // given
        DeliveryDto depotDelivery = new DeliveryDto(1L, "Jan Kowalski", "123456789", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        DeliveryDto delivery2 = new DeliveryDto(2L, "Anna Nowak", "987654321", "ul. Test2", "2", null,
                "00-002", "Kraków", "PL", 52.2300, 21.0125, "M", "ADDED");
        VehicleDto vehicle = new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "courier-1");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(depotDelivery, delivery2));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(vehicle));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1", "2"),
                List.of(List.of(0.0, 100.0, 200.0), List.of(100.0, 0.0, 150.0), List.of(200.0, 150.0, 0.0)),
                List.of(List.of(0, 1000, 2000), List.of(1000, 0, 1500), List.of(2000, 1500, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);

        RouteResponseDto routeResponse = new RouteResponseDto(3500L, 315L,
                new RouteResponseDto.Geometry("LineString", List.of()));
        when(routingClient.route(any())).thenReturn(routeResponse);

        org.example.routeoptimizationservice.algorithm.Solution solution =
                new org.example.routeoptimizationservice.algorithm.Solution(List.of(List.of(1, 2)), 450.0);
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class))).thenReturn(solution);

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L, 2L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        OptimizationResult result = service.optimizeSync(request);

        // then
        assertThat(result).isNotNull();
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.DISTANCE);
        assertThat(result.routes()).hasSize(1);
        RoutePlan plan = result.routes().get(0);
        assertThat(plan.vehicleId()).isEqualTo(10L);
        assertThat(plan.deliveryIdsInOrder()).containsExactly(1L, 2L);
        assertThat(plan.fuelLiters()).isPositive();
        assertThat(result.totalFuelLiters()).isPositive();
    }

    @Test
    void shouldOptimizeByTime() {
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
        assertThat(result.totalDurationSeconds()).isPositive();
    }

    @Test
    void shouldOptimizeByFuel() {
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
                OptimizationCriterion.FUEL, 8.0
        );

        // when
        OptimizationResult result = service.optimizeSync(request);

        // then
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.FUEL);
        assertThat(result.totalFuelLiters()).isPositive();
    }

    @Test
    void shouldThrowWhenNoValidDeliveries() {
        // given
        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of());
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(
                new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1")));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(99L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when / then
        assertThatThrownBy(() -> service.optimizeSync(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No valid deliveries found");
    }

    @Test
    void shouldThrowWhenNoValidVehicles() {
        // given
        DeliveryDto delivery = new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(delivery));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of());

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(99L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when / then
        assertThatThrownBy(() -> service.optimizeSync(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("No valid vehicles found");
    }

    @Test
    void shouldSaveRouteToHistoryForEachVehicleRoute() {
        // given
        DeliveryDto d1 = new DeliveryDto(1L, "Jan", "123", "ul. Test", "1", null,
                "00-001", "Warszawa", "PL", 52.2297, 21.0122, "S", "ADDED");
        DeliveryDto d2 = new DeliveryDto(2L, "Anna", "456", "ul. Test2", "2", null,
                "00-002", "Kraków", "PL", 52.2300, 21.0125, "M", "ADDED");
        VehicleDto vehicle = new VehicleDto(10L, "Toyota", "Corolla", "WA 12345", 10, true, "c1");

        when(deliveryClient.getAvailableDeliveries(0, 1000)).thenReturn(List.of(d1, d2));
        when(deliveryClient.getVehicles(0, 1000)).thenReturn(List.of(vehicle));

        MatrixResponse matrix = new MatrixResponse(
                List.of("0", "1", "2"),
                List.of(List.of(0.0, 60.0, 120.0), List.of(60.0, 0.0, 90.0), List.of(120.0, 90.0, 0.0)),
                List.of(List.of(0, 1000, 2000), List.of(1000, 0, 1500), List.of(2000, 1500, 0))
        );
        when(routingClient.matrix(any())).thenReturn(matrix);
        when(routingClient.route(any())).thenReturn(new RouteResponseDto(3500L, 315L,
                new RouteResponseDto.Geometry("LineString", List.of())));
        when(optimizer.optimize(any(), anyList(), anyList(), any(double[][].class)))
                .thenReturn(new org.example.routeoptimizationservice.algorithm.Solution(List.of(List.of(1, 2)), 450.0));

        OptimizationRequest request = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L, 2L), List.of(10L),
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        service.optimizeSync(request);

        // then
        ArgumentCaptor<CreateRouteHistoryRequest> captor = ArgumentCaptor.forClass(CreateRouteHistoryRequest.class);
        verify(historyClient).create(captor.capture());

        CreateRouteHistoryRequest saved = captor.getValue();
        assertThat(saved.tripId()).isEqualTo(10L);
        assertThat(saved.totalDistanceM()).isPositive();
        assertThat(saved.stops()).hasSize(2);
        assertThat(saved.stops().get(0).deliveryId()).isEqualTo(1L);
        assertThat(saved.stops().get(1).deliveryId()).isEqualTo(2L);
    }

    @Test
    void shouldUseFuelConsumptionFromRequest() {
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

        OptimizationRequest lowFuel = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.FUEL, 5.0
        );
        OptimizationRequest highFuel = new OptimizationRequest(
                52.2297, 21.0122, List.of(1L), List.of(10L),
                OptimizationCriterion.FUEL, 20.0
        );

        // when
        OptimizationResult low = service.optimizeSync(lowFuel);
        OptimizationResult high = service.optimizeSync(highFuel);

        // then
        assertThat(high.totalFuelLiters()).isGreaterThan(low.totalFuelLiters());
    }

    @Test
    void shouldNotSaveHistoryWhenNoRoutes() {
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
        service.optimizeSync(request);

        // then
        verify(historyClient, never()).create(any());
    }

    @Test
    void optimizeShouldReturnCompletableFutureAndCompleteAsynchronously() throws Exception {
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
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when — returns immediately (non-blocking)
        CompletableFuture<OptimizationResult> future = service.optimize(request);

        // then — result available after completion
        assertThat(future).isNotNull();

        OptimizationResult result = future.join();
        assertThat(result).isNotNull();
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.DISTANCE);
        assertThat(result.routes()).hasSize(1);
        assertThat(result.totalDistanceMeters()).isEqualTo(2000.0);
        assertThat(result.totalFuelLiters()).isEqualTo(2000.0 / 1000.0 * 8.0 / 100.0);

        verify(historyClient).create(any());
    }

    @Test
    void scheduleOptimizationShouldReturnJobIdAndCompleteAsynchronously() throws Exception {
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
                OptimizationCriterion.DISTANCE, 8.0
        );

        // when
        String jobId = service.scheduleOptimization(request);

        // then — jobId returned immediately
        assertThat(jobId).isNotNull();
        assertThat(service.jobExists(jobId)).isTrue();

        CompletableFuture<OptimizationResult> future = service.getJobFuture(jobId);
        assertThat(future).isNotNull();

        OptimizationResult result = future.join();
        assertThat(result).isNotNull();
        assertThat(result.criterion()).isEqualTo(OptimizationCriterion.DISTANCE);
        assertThat(result.totalDistanceMeters()).isEqualTo(2000.0);

        // job completed and moved to completedResults
        assertThat(service.jobExists(jobId)).isTrue();
        assertThat(service.getCompletedResult(jobId)).isEqualTo(result);

        verify(historyClient).create(any());
    }
}
