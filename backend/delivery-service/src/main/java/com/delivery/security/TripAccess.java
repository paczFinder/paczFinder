package com.delivery.security;

import com.delivery.entity.Trip;
import com.delivery.repository.TripRepository;
import io.quarkus.security.ForbiddenException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.jwt.JsonWebToken;

@ApplicationScoped
public class TripAccess {

    private final TripRepository tripRepository;
    private final JsonWebToken jwt;

    public TripAccess(TripRepository tripRepository, JsonWebToken jwt) {
        this.tripRepository = tripRepository;
        this.jwt = jwt;
    }

    public void requireCourierOwnsTrip(Long tripId, SecurityIdentity identity) {
        if (isManager(identity)) {
            return;
        }

        Trip trip = tripRepository.findById(tripId);
        if (trip == null) {
            throw new jakarta.ws.rs.NotFoundException("Trip not found: " + tripId);
        }

        requireCourierIdentity(trip.vehicle.courierKeycloakId, identity);
    }

    public void requireCourierOwnsDelivery(Long deliveryId, SecurityIdentity identity) {
        if (isManager(identity)) {
            return;
        }

        Trip trip = tripRepository.findByDeliveryId(deliveryId).orElse(null);
        if (trip == null) {
            throw new jakarta.ws.rs.NotFoundException("Delivery is not assigned to a trip: " + deliveryId);
        }

        requireCourierIdentity(trip.vehicle.courierKeycloakId, identity);
    }

    private boolean isManager(SecurityIdentity identity) {
        return identity.hasRole("ADMIN") || identity.hasRole("DISPATCHER");
    }

    private void requireCourierIdentity(String ownerKeycloakId, SecurityIdentity identity) {
        if (!identity.hasRole("COURIER")) {
            throw new ForbiddenException();
        }

        String keycloakUserId = jwt.getSubject();
        if (keycloakUserId == null) {
            keycloakUserId = identity.getPrincipal().getName();
        }

        if (ownerKeycloakId == null || !ownerKeycloakId.equals(keycloakUserId)) {
            throw new ForbiddenException();
        }
    }
}
