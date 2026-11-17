package com.history.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "route_history_stops")
public class RouteHistoryStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_history_id", nullable = false)
    public RouteHistory routeHistory;

    @Column(name = "delivery_id", nullable = false)
    public Long deliveryId;

    @Column(name = "stop_order", nullable = false)
    public Integer stopOrder;

    @Column(name = "address", nullable = false, length = 255)
    public String address;

    @Column(name = "latitude")
    public Double latitude;

    @Column(name = "longitude")
    public Double longitude;
}