package com.delivery.repository;

import com.delivery.dto.TripFilter;
import com.delivery.entity.Trip;
import com.delivery.enums.TripStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class TripRepository implements PanacheRepository<Trip> {

    private static final String LIST_QUERY = """
            (:search is null
                or lower(vehicle.brand) like :search
                or lower(vehicle.model) like :search
                or lower(vehicle.registrationNumber) like :search)
            and (:status is null or status = :status)
            """;

    public List<Trip> findPaginated(int pageIndex, int pageSize, TripFilter filter) {
        return find(LIST_QUERY, sort(filter.sort(), filter.direction()), params(filter))
                .page(pageIndex, pageSize)
                .list();
    }

    public long count(TripFilter filter) {
        return count(LIST_QUERY, params(filter));
    }

    public Optional<Trip> findByDeliveryId(Long deliveryId) {
        return find(
                "select t from Trip t join t.deliveries d where d.id = ?1",
                deliveryId
        ).singleResultOptional();
    }

    private static Parameters params(TripFilter filter) {
        TripStatus status = filter.status() == null || filter.status().isBlank()
                ? null
                : TripStatus.valueOf(filter.status().toUpperCase());
        return Parameters.with("search", like(filter.search()))
                .and("status", status);
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
