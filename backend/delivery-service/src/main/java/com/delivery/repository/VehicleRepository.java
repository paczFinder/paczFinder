package com.delivery.repository;

import com.delivery.dto.VehicleFilter;
import com.delivery.entity.Vehicle;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class VehicleRepository implements PanacheRepository<Vehicle> {

   private static final String LIST_QUERY = """
            (:search is null
                or lower(brand) like :search
                or lower(model) like :search
                or lower(registrationNumber) like :search)
            and (:active is null or active = :active)
            and (:hasCourier is null
                or (:hasCourier = true and courierKeycloakId is not null)
                or (:hasCourier = false and courierKeycloakId is null))
            """;

    public List<Vehicle> findPaginated(int pageIndex, int pageSize, VehicleFilter filter) {
        return find(LIST_QUERY, sort(filter.sort(), filter.direction()), params(filter))
                .page(pageIndex, pageSize)
                .list();
    }

    public long count(VehicleFilter filter) {
        return count(LIST_QUERY, params(filter));
    }

    private static Parameters params(VehicleFilter filter) {
        return Parameters.with("search", like(filter.search()))
                .and("active", filter.active())
                .and("hasCourier", filter.hasCourier());
    }

    private static String like(String search) {
        return search == null || search.isBlank() ? null : "%" + search.trim().toLowerCase() + "%";
    }

    private static Sort sort(String field, String direction) {
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.Descending : Sort.Direction.Ascending;
        String column = field == null || field.isBlank() ? "id" : field;
        Sort sort = Sort.by(column, dir);
        return column.equals("id") ? sort : sort.and("id", dir);
    }
}
