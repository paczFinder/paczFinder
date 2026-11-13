package com.history.service;

import com.history.dto.CreateRouteHistoryRequest;
import com.history.dto.PaginatedResponse;
import com.history.dto.RouteHistoryResponse;
import com.history.entity.RouteHistory;
import com.history.entity.RouteHistoryStop;
import com.history.repository.RouteHistoryRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@ApplicationScoped
public class RouteHistoryService {

    private final RouteHistoryRepository routeHistoryRepository;

    public RouteHistoryService(RouteHistoryRepository routeHistoryRepository) {
        this.routeHistoryRepository = routeHistoryRepository;
    }

    public PaginatedResponse<RouteHistoryResponse> findAll(int page, int size) {
        int pageIndex = Math.max(page, 0);
        int pageSize = Math.max(size, 1);

        List<RouteHistory> routeHistories = routeHistoryRepository.findPaginated(pageIndex, pageSize);
        long totalElements = routeHistoryRepository.count();
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);

        return new PaginatedResponse<>(
                routeHistories.stream()
                        .map(RouteHistoryResponse::from)
                        .toList(),
                totalElements,
                pageIndex,
                pageSize,
                totalPages
        );
    }

    public RouteHistoryResponse findById(Long id) {
        return RouteHistoryResponse.from(getRouteHistory(id));
    }

    public RouteHistoryResponse findBySourceRoutePlanId(Long sourceRoutePlanId) {
        RouteHistory routeHistory = routeHistoryRepository.findBySourceRoutePlanId(sourceRoutePlanId);

        if (routeHistory == null) {
            throw new NotFoundException("Route history not found for source route plan ID: " + sourceRoutePlanId);
        }

        return RouteHistoryResponse.from(routeHistory);
    }

    public List<RouteHistoryResponse> findByTripId(Long tripId) {
        return routeHistoryRepository.findByTripId(tripId)
                .stream()
                .map(RouteHistoryResponse::from)
                .toList();
    }

    public RouteHistoryResponse findLatestByTripId(Long tripId) {
        RouteHistory routeHistory = routeHistoryRepository.findLatestByTripId(tripId);

        if (routeHistory == null) {
            throw new NotFoundException("No route history found for trip ID: " + tripId);
        }

        return RouteHistoryResponse.from(routeHistory);
    }

    @Transactional
    public RouteHistoryResponse create(CreateRouteHistoryRequest request) {
        if (routeHistoryRepository.findBySourceRoutePlanId(request.sourceRoutePlanId()) != null) {
            throw new BadRequestException("Route history already exists for source route plan ID: " + request.sourceRoutePlanId());
        }

        RouteHistory routeHistory = new RouteHistory();
        routeHistory.sourceRoutePlanId = request.sourceRoutePlanId();
        routeHistory.tripId = request.tripId();
        routeHistory.totalDistanceM = request.totalDistanceM();
        routeHistory.drivingTimeS = request.drivingTimeS();
        routeHistory.serviceTimeS = request.serviceTimeS();
        routeHistory.totalTimeS = request.totalTimeS();
        routeHistory.calculatedAt = Instant.now();

        List<RouteHistoryStop> stops = new ArrayList<>();
        for (var stopRequest : request.stops()) {
            RouteHistoryStop stop = new RouteHistoryStop();
            stop.routeHistory = routeHistory;
            stop.deliveryId = stopRequest.deliveryId();
            stop.stopOrder = stopRequest.stopOrder();
            stop.address = stopRequest.address().trim();
            stop.latitude = stopRequest.latitude();
            stop.longitude = stopRequest.longitude();
            stops.add(stop);
        }

        stops.sort(Comparator.comparingInt(stop -> stop.stopOrder));
        routeHistory.stops.addAll(stops);

        routeHistoryRepository.persist(routeHistory);

        return RouteHistoryResponse.from(routeHistory);
    }

    @Transactional
    public void delete(Long id) {
        RouteHistory routeHistory = getRouteHistory(id);
        routeHistoryRepository.delete(routeHistory);
    }

    private RouteHistory getRouteHistory(Long id) {
        RouteHistory routeHistory = routeHistoryRepository.findById(id);

        if (routeHistory == null) {
            throw new NotFoundException("Route history not found: " + id);
        }

        return routeHistory;
    }
}
