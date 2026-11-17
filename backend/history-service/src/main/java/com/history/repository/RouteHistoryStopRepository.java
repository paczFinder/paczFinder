package com.history.repository;

import com.history.entity.RouteHistoryStop;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RouteHistoryStopRepository implements PanacheRepository<RouteHistoryStop> {
}

