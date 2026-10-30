package com.delivery.repository;

import com.delivery.entity.Delivery;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class DeliveryRepository implements PanacheRepository<Delivery> {

    public List<Delivery> findPaginated(int pageIndex, int pageSize) {
        return find("order by id asc")
                .page(pageIndex, pageSize)
                .list();
    }

    public List<Delivery> findAvailablePaginated(int pageIndex, int pageSize) {
        return find("status = ?1 order by id asc", com.delivery.enums.DeliveryStatus.ADDED)
                .page(pageIndex, pageSize)
                .list();
    }
}
