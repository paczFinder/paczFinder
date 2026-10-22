package com.delivery.repository;

import com.delivery.entity.Trip;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class TripRepository implements PanacheRepository<Trip> {

    public List<Trip> findByDeliveryId(Long deliveryId) {
        return find(
                "select distinct t from Trip t join t.deliveries d where d.id = ?1",
                deliveryId
        ).list();
    }
}
