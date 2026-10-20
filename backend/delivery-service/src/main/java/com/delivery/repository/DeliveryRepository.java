package com.delivery.repository;

import com.delivery.entity.Delivery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class DeliveryRepository implements PanacheRepository<Delivery> {
}
