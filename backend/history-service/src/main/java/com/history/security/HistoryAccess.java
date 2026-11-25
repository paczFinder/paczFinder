package com.history.security;

import com.history.entity.RouteHistory;
import com.history.repository.RouteHistoryRepository;
import io.quarkus.security.ForbiddenException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class HistoryAccess {

    private final RouteHistoryRepository repository;
    private final JsonWebToken jwt;

    public HistoryAccess(RouteHistoryRepository repository, JsonWebToken jwt) {
        this.repository = repository;
        this.jwt = jwt;
    }

    public void requireOwnerForHistory(Long historyId, SecurityIdentity identity) {
        if (isManager(identity)) {
            return;
        }

        RouteHistory history = repository.findById(historyId);
        if (history == null) {
            throw new jakarta.ws.rs.NotFoundException("Route history not found: " + historyId);
        }
        requireOwner(history.courierKeycloakId, identity);
    }

    public void requireOwnerForTrip(Long tripId, SecurityIdentity identity) {
        if (isManager(identity)) {
            return;
        }

        String owner = currentCourierId(identity);
        RouteHistory history = repository.findLatestByTripIdAndCourier(tripId, owner);
        if (history == null) {
            throw new ForbiddenException();
        }
    }

    public void requireOwner(RouteHistory history, SecurityIdentity identity) {
        if (!isManager(identity)) {
            requireOwner(history.courierKeycloakId, identity);
        }
    }

    public boolean isManager(SecurityIdentity identity) {
        return identity.hasRole("ADMIN") || identity.hasRole("DISPATCHER");
    }

    private void requireOwner(String ownerKeycloakId, SecurityIdentity identity) {
        if (!identity.hasRole("COURIER")) {
            throw new ForbiddenException();
        }

        String courierId = currentCourierId(identity);
        if (ownerKeycloakId == null || !ownerKeycloakId.equals(courierId)) {
            throw new ForbiddenException();
        }
    }

    private String currentCourierId(SecurityIdentity identity) {
        String subject = jwt.getSubject();
        return subject != null ? subject : identity.getPrincipal().getName();
    }
}

