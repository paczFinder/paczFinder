package org.example.routeoptimizationservice.service;

import org.example.routeoptimizationservice.algorithm.AntColonyOptimizer;
import org.example.routeoptimizationservice.algorithm.BruteForceOptimizer;
import org.example.routeoptimizationservice.algorithm.Location;
import org.example.routeoptimizationservice.algorithm.SimulatedAnnealingOptimizer;
import org.example.routeoptimizationservice.algorithm.Solution;
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
import org.example.routeoptimizationservice.dto.RoutePlan;
import org.example.routeoptimizationservice.dto.RouteResponseDto;
import org.example.routeoptimizationservice.dto.VehicleDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
public class RouteOptimizationService {

    private static final Logger log = LoggerFactory.getLogger(RouteOptimizationService.class);

    private static final Double PACKAGE_SERVICE_TIME = 60.0;

    private final DeliveryClient deliveryClient;
    private final RoutingClient routingClient;
    private final HistoryClient historyClient;
    private final AntColonyOptimizer optimizer;
    private final SimulatedAnnealingOptimizer annealingOptimizer;
    private final BruteForceOptimizer bruteForceOptimizer;
    private final AtomicLong routePlanCounter = new AtomicLong(System.currentTimeMillis());

    private final Map<String, CompletableFuture<OptimizationResult>> pendingJobs = new ConcurrentHashMap<>();
    private final Map<String, OptimizationResult> completedResults = new ConcurrentHashMap<>();

    public RouteOptimizationService(DeliveryClient deliveryClient,
                                    RoutingClient routingClient,
                                    HistoryClient historyClient,
                                    AntColonyOptimizer optimizer,
                                    SimulatedAnnealingOptimizer annealingOptimizer,
                                    BruteForceOptimizer bruteForceOptimizer) {
        this.deliveryClient = deliveryClient;
        this.routingClient = routingClient;
        this.historyClient = historyClient;
        this.optimizer = optimizer;
        this.annealingOptimizer = annealingOptimizer;
        this.bruteForceOptimizer = bruteForceOptimizer;
    }

    @Bean
    public Executor optimizationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("optimization-");
        executor.initialize();
        return executor;
    }

    public String scheduleOptimization(OptimizationRequest request) {
        return scheduleJob(() -> optimizeSync(request));
    }

    public String scheduleAnnealingOptimization(OptimizationRequest request) {
        return scheduleJob(() -> optimizeAnnealingSync(request));
    }

    public String scheduleBruteForceOptimization(OptimizationRequest request) {
        return scheduleJob(() -> optimizeBruteForceSync(request));
    }

    private String scheduleJob(Supplier<OptimizationResult> optimization) {
        String jobId = UUID.randomUUID().toString();
        CompletableFuture<OptimizationResult> future = CompletableFuture.supplyAsync(
                optimization, optimizationExecutor());
        pendingJobs.put(jobId, future);
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.warn("Optymalizacja job {} zakończona błędem: {}", jobId, ex.getMessage());
            } else {
                completedResults.put(jobId, result);
            }
            pendingJobs.remove(jobId);
        });
        return jobId;
    }

    public CompletableFuture<OptimizationResult> getJobFuture(String jobId) {
        return pendingJobs.get(jobId);
    }

    public OptimizationResult getCompletedResult(String jobId) {
        return completedResults.get(jobId);
    }

    public boolean jobExists(String jobId) {
        return pendingJobs.containsKey(jobId) || completedResults.containsKey(jobId);
    }

    public CompletableFuture<OptimizationResult> optimize(OptimizationRequest request) {
        return CompletableFuture.supplyAsync(() -> optimizeSync(request));
    }

    public OptimizationResult optimizeSync(OptimizationRequest request) {
        return optimizeSync(request, optimizer::optimize);
    }

    public OptimizationResult optimizeAnnealingSync(OptimizationRequest request) {
        return optimizeSync(request, annealingOptimizer::optimize);
    }

    public OptimizationResult optimizeBruteForceSync(OptimizationRequest request) {
        return optimizeSync(request, bruteForceOptimizer::optimize);
    }

    private OptimizationResult optimizeSync(OptimizationRequest request, RouteSolver solver) {
        List<DeliveryDto> allDeliveries = deliveryClient.getAvailableDeliveries(0, 1000);
        List<VehicleDto> allVehicles = deliveryClient.getVehicles(0, 1000);

        Map<Long, DeliveryDto> deliveryById = allDeliveries.stream()
                .collect(Collectors.toMap(DeliveryDto::id, d -> d));

        Map<Long, VehicleDto> vehicleById = allVehicles.stream()
                .collect(Collectors.toMap(VehicleDto::id, v -> v));

        List<DeliveryDto> selectedDeliveries = request.deliveryIds().stream()
                .map(deliveryById::get)
                .filter(java.util.Objects::nonNull)
                .toList();

        List<VehicleDto> selectedVehicles = request.vehicleIds().stream()
                .map(vehicleById::get)
                .filter(java.util.Objects::nonNull)
                .toList();

        if (selectedDeliveries.isEmpty()) {
            throw new IllegalArgumentException("No valid deliveries found");
        }

        if (selectedVehicles.isEmpty()) {
            throw new IllegalArgumentException("No valid vehicles found");
        }

        List<Location> locations = buildLocations(request, selectedDeliveries);
        List<Integer> capacities = selectedVehicles.stream()
                .map(VehicleDto::capacity)
                .toList();

        double[][] costMatrix = buildCostMatrix(locations, request.criterion(), request.fuelConsumptionLitersPer100km());

        var solution = solver.solve(locations.get(0), locations.subList(1, locations.size()), capacities, costMatrix);

        List<RoutePlan> routePlans = new ArrayList<>();
        double totalDistance = 0.0;
        double totalDuration = 0.0;
        double totalFuel = 0.0;

        int vehicleIndex = 0;
        long sourceRoutePlanId = routePlanCounter.incrementAndGet();

        for (List<Integer> routeNodes : solution.routes()) {
            if (routeNodes.isEmpty() || vehicleIndex >= selectedVehicles.size()) {
                continue;
            }

            VehicleDto vehicle = selectedVehicles.get(vehicleIndex);
            vehicleIndex++;

            List<PointDto> orderedPoints = new ArrayList<>();
            orderedPoints.add(new PointDto("depot", request.depotLatitude(), request.depotLongitude()));

            List<Long> deliveryIdsInOrder = new ArrayList<>();
            for (Integer nodeIdx : routeNodes) {
                DeliveryDto d = selectedDeliveries.get(nodeIdx - 1);
                deliveryIdsInOrder.add(d.id());
                orderedPoints.add(new PointDto(String.valueOf(d.id()), d.latitude(), d.longitude()));
            }

            orderedPoints.add(new PointDto("depot", request.depotLatitude(), request.depotLongitude()));

            RouteResponseDto geometry = routingClient.route(new RoutingClient.RouteRequestBody(orderedPoints));

            double distanceM = geometry.totalDistanceMeters();
            double durationS = geometry.totalDurationSeconds();
            double fuelLiters = distanceM / 1000.0 * request.fuelConsumptionLitersPer100km() / 100.0;

            routePlans.add(new RoutePlan(
                    vehicle.id(),
                    vehicle.registrationNumber(),
                    deliveryIdsInOrder,
                    distanceM,
                    durationS,
                    fuelLiters
            ));

            totalDistance += distanceM;
            totalDuration += durationS;
            totalFuel += fuelLiters;

            saveToHistory(sourceRoutePlanId++, vehicle.id(), request.fuelConsumptionLitersPer100km(),
                    deliveryIdsInOrder, selectedDeliveries, distanceM, durationS, fuelLiters);
        }

        return new OptimizationResult(routePlans, totalDistance, totalDuration, totalFuel, request.criterion());
    }

    private void saveToHistory(long sourceRoutePlanId, Long tripId, Double fuelLitersPer100km,
                               List<Long> deliveryIdsInOrder, List<DeliveryDto> allDeliveries,
                               double distanceM, double durationS, double fuelLiters) {
        Map<Long, DeliveryDto> deliveryById = allDeliveries.stream()
                .collect(Collectors.toMap(DeliveryDto::id, d -> d));

        List<CreateRouteHistoryStopRequest> stops = new ArrayList<>();
        int stopOrder = 1;
        for (Long deliveryId : deliveryIdsInOrder) {
            DeliveryDto d = deliveryById.get(deliveryId);
            if (d == null) {
                continue;
            }
            stops.add(new CreateRouteHistoryStopRequest(
                    d.id(),
                    stopOrder++,
                    buildAddress(d),
                    d.latitude(),
                    d.longitude()
            ));
        }

        if (stops.isEmpty()) {
            return;
        }

        long drivingTimeS = (long) Math.ceil(durationS);
        long serviceTimeS = (long) Math.ceil(stops.size() * PACKAGE_SERVICE_TIME); // 1 min obsługi na przystanek
        long totalTimeS = drivingTimeS + serviceTimeS;
        long totalDistanceM = (long) Math.ceil(distanceM);

        CreateRouteHistoryRequest request = new CreateRouteHistoryRequest(
                sourceRoutePlanId,
                tripId,
                totalDistanceM,
                drivingTimeS,
                serviceTimeS,
                totalTimeS,
                stops
        );

        try {
            historyClient.create(request);
        } catch (Exception ex) {
            log.warn("Nie udało się zapisać trasy do historii (sourceRoutePlanId={}): {}", sourceRoutePlanId, ex.getMessage());
        }
    }

    private String buildAddress(DeliveryDto d) {
        List<String> parts = new ArrayList<>();
        if (d.street() != null) parts.add(d.street());
        if (d.buildingNumber() != null) parts.add(d.buildingNumber());
        if (d.apartmentNumber() != null) parts.add(d.apartmentNumber());
        if (d.postalCode() != null) parts.add(d.postalCode());
        if (d.city() != null) parts.add(d.city());
        if (d.country() != null) parts.add(d.country());
        String address = String.join(", ", parts);
        return address.isBlank() ? "Dostawa " + d.id() : address;
    }

    private List<Location> buildLocations(OptimizationRequest request, List<DeliveryDto> deliveries) {
        List<Location> locations = new ArrayList<>();
        locations.add(new Location(0, request.depotLatitude(), request.depotLongitude(), 0));
        for (int i = 0; i < deliveries.size(); i++) {
            DeliveryDto d = deliveries.get(i);
            locations.add(new Location(i + 1, d.latitude(), d.longitude(), sizeToLoadUnits(d.size())));
        }
        return locations;
    }

    private double[][] buildCostMatrix(List<Location> locations, OptimizationCriterion criterion, double fuelLitersPer100km) {
        int size = locations.size();
        double[][] distances = new double[size][size];
        double[][] durations = new double[size][size];

        try {
            List<PointDto> pointDtos = locations.stream()
                    .map(l -> new PointDto(String.valueOf(l.id()), l.latitude(), l.longitude()))
                    .toList();

            MatrixResponse matrixResponse = routingClient.matrix(new RoutingClient.MatrixRequestBody(pointDtos));

            for (int i = 0; i < size; i++) {
                for (int j = 0; j < size; j++) {
                    if (matrixResponse.distances() == null || matrixResponse.durations() == null) {
                        throw new IllegalStateException("Routing service returned incomplete matrix (missing distances or durations)");
                    }
                    distances[i][j] = matrixResponse.distances().get(i).get(j).doubleValue();
                    durations[i][j] = matrixResponse.durations().get(i).get(j);
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Routing service unavailable — cannot build cost matrix", ex);
        }

        double[][] matrix = new double[size][size];
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                switch (criterion) {
                    case TIME -> matrix[i][j] = durations[i][j];
                    case FUEL -> matrix[i][j] = distances[i][j] * fuelLitersPer100km / 100000.0;
                    case DISTANCE -> matrix[i][j] = distances[i][j];
                    default -> matrix[i][j] = distances[i][j];
                }
            }
        }

        return matrix;
    }

    private int locationIndex(PointDto point, List<Location> locations) {
        try {
            return Integer.parseInt(point.id());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private int sizeToLoadUnits(String size) {
        return switch (size) {
            case "S" -> 1;
            case "M" -> 2;
            case "L" -> 4;
            default -> 4;
        };
    }

    /** Wspólna sygnatura algorytmów (ACO, SA i brute force przyjmują te same dane i zwracają Solution). */
    @FunctionalInterface
    private interface RouteSolver {
        Solution solve(Location depot, List<Location> deliveries, List<Integer> capacities, double[][] costMatrix);
    }
}
