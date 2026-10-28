package com.delivery.repository;

import com.delivery.entity.Trip;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class TripRepository implements PanacheRepository<Trip> {

    public Optional<Trip> findByDeliveryId(Long deliveryId) {
        return find(
                "select t from Trip t join t.deliveries d where d.id = ?1",
                deliveryId
        ).singleResultOptional();
    }
}
