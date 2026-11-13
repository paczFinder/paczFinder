package com.history.repository;

import com.history.entity.RouteHistory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class RouteHistoryRepository implements PanacheRepository<RouteHistory> {

    public RouteHistory findBySourceRoutePlanId(Long sourceRoutePlanId) {
        return find("sourceRoutePlanId = ?1", sourceRoutePlanId).firstResult();
    }

    public List<RouteHistory> findByTripId(Long tripId) {
        return find("tripId = ?1 order by calculatedAt desc", tripId).list();
    }

    public RouteHistory findLatestByTripId(Long tripId) {
        return find("tripId = ?1 order by calculatedAt desc", tripId).firstResult();
    }

    public List<RouteHistory> findPaginated(int pageIndex, int pageSize) {
        return find("order by calculatedAt desc")
                .page(pageIndex, pageSize)
                .list();
    }
}
