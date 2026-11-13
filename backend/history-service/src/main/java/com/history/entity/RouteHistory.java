package com.history.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "route_history")
public class RouteHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "source_route_plan_id", nullable = false, unique = true)
    public Long sourceRoutePlanId;

    @Column(name = "trip_id", nullable = false)
    public Long tripId;

    @Column(name = "total_distance_m", nullable = false)
    public Long totalDistanceM;

    @Column(name = "driving_time_s", nullable = false)
    public Long drivingTimeS;

    @Column(name = "service_time_s", nullable = false)
    public Long serviceTimeS;

    @Column(name = "total_time_s", nullable = false)
    public Long totalTimeS;

    @Column(name = "calculated_at", nullable = false)
    public Instant calculatedAt = Instant.now();

    @OneToMany(mappedBy = "routeHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<RouteHistoryStop> stops = new ArrayList<>();
}