package com.delivery.repository;

import com.delivery.dto.DeliveryFilter;
import com.delivery.entity.Delivery;
import com.delivery.enums.DeliverySize;
import com.delivery.enums.DeliveryStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class DeliveryRepository implements PanacheRepository<Delivery> {

    private static final String LIST_QUERY = """
            (:search is null
                or lower(recipientName) like :search
                or lower(recipientPhone) like :search
                or lower(street) like :search
                or lower(city) like :search
                or lower(postalCode) like :search)
            and (:status is null or status = :status)
            and (:size is null or size = :size)
            """;

    public List<Delivery> findPaginated(int pageIndex, int pageSize, DeliveryFilter filter, boolean availableOnly) {
        return find(LIST_QUERY, sort(filter.sort(), filter.direction()), params(filter, availableOnly))
                .page(pageIndex, pageSize)
                .list();
    }

    public long count(DeliveryFilter filter, boolean availableOnly) {
        return count(LIST_QUERY, params(filter, availableOnly));
    }

    private static Parameters params(DeliveryFilter filter, boolean availableOnly) {
        DeliveryStatus status = availableOnly ? DeliveryStatus.ADDED : toEnum(DeliveryStatus.class, filter.status());
        return Parameters.with("search", like(filter.search()))
                .and("status", status)
                .and("size", toEnum(DeliverySize.class, filter.size()));
    }

    private static <E extends Enum<E>> E toEnum(Class<E> type, String value) {
        return value == null || value.isBlank() ? null : Enum.valueOf(type, value.toUpperCase());
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
