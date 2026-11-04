package com.delivery.repository;

import com.delivery.entity.Vehicle;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class VehicleRepository implements PanacheRepository<Vehicle> {

    public List<Vehicle> findPaginated(int pageIndex, int pageSize) {
        return find("order by id asc")
                .page(pageIndex, pageSize)
                .list();
    }
}
