package com.delivery.seed;

import com.delivery.entity.Delivery;
import com.delivery.entity.Trip;
import com.delivery.entity.Vehicle;
import com.delivery.enums.DeliverySize;
import com.delivery.enums.DeliveryStatus;
import com.delivery.enums.TripStatus;
import com.delivery.repository.DeliveryRepository;
import com.delivery.repository.TripRepository;
import com.delivery.repository.VehicleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DataSeeder {

    private static final Logger LOG = Logger.getLogger(DataSeeder.class);

    private final VehicleRepository vehicleRepository;
    private final DeliveryRepository deliveryRepository;
    private final TripRepository tripRepository;
    private final ObjectMapper objectMapper;
    private final boolean vehiclesEnabled;
    private final boolean deliveriesEnabled;
    private final boolean tripsEnabled;

    public DataSeeder(
            VehicleRepository vehicleRepository,
            DeliveryRepository deliveryRepository,
            TripRepository tripRepository,
            ObjectMapper objectMapper,
            @ConfigProperty(name = "app.seed.vehicles.enabled", defaultValue = "true") boolean vehiclesEnabled,
            @ConfigProperty(name = "app.seed.deliveries.enabled", defaultValue = "true") boolean deliveriesEnabled,
            @ConfigProperty(name = "app.seed.trips.enabled", defaultValue = "true") boolean tripsEnabled
    ) {
        this.vehicleRepository = vehicleRepository;
        this.deliveryRepository = deliveryRepository;
        this.tripRepository = tripRepository;
        this.objectMapper = objectMapper;
        this.vehiclesEnabled = vehiclesEnabled;
        this.deliveriesEnabled = deliveriesEnabled;
        this.tripsEnabled = tripsEnabled;
    }

    record VehicleSeed(
            String brand,
            String model,
            String registrationNumber,
            Integer capacity,
            boolean active,
            String courierKeycloakId
    ) {
    }

    record DeliverySeed(
            String ref,
            String recipientName,
            String recipientPhone,
            String street,
            String buildingNumber,
            String apartmentNumber,
            String postalCode,
            String city,
            String country,
            Double latitude,
            Double longitude,
            DeliverySize size
    ) {
    }

    record TripSeed(
            String registrationNumber,
            TripStatus status,
            List<String> deliveries
    ) {
    }

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (vehiclesEnabled) {
            seedVehicles();
        }

        Map<String, Delivery> seededDeliveries = deliveriesEnabled ? seedDeliveries() : Map.of();

        if (tripsEnabled) {
            seedTrips(seededDeliveries);
        }
    }

    private void seedVehicles() {
        if (vehicleRepository.count() > 0) {
            LOG.debug("Vehicles table is not empty – skipping vehicle seed");
            return;
        }

        List<VehicleSeed> seeds = read("seed/vehicles.json", new TypeReference<>() {
        });
        for (VehicleSeed seed : seeds) {
            Vehicle vehicle = new Vehicle();
            vehicle.brand = seed.brand();
            vehicle.model = seed.model();
            vehicle.registrationNumber = seed.registrationNumber();
            vehicle.capacity = seed.capacity();
            vehicle.active = seed.active();
            vehicle.courierKeycloakId = seed.courierKeycloakId();
            vehicleRepository.persist(vehicle);
        }
        LOG.infof("Seeded %d vehicles", seeds.size());
    }

    private Map<String, Delivery> seedDeliveries() {
        if (deliveryRepository.count() > 0) {
            LOG.debug("Deliveries table is not empty – skipping delivery seed");
            return Map.of();
        }

        List<DeliverySeed> seeds = read("seed/deliveries.json", new TypeReference<>() {
        });
        Map<String, Delivery> byRef = new HashMap<>();
        for (DeliverySeed seed : seeds) {
            Delivery delivery = new Delivery();
            delivery.recipientName = seed.recipientName();
            delivery.recipientPhone = seed.recipientPhone();
            delivery.street = seed.street();
            delivery.buildingNumber = seed.buildingNumber();
            delivery.apartmentNumber = seed.apartmentNumber();
            delivery.postalCode = seed.postalCode();
            delivery.city = seed.city();
            delivery.country = seed.country();
            delivery.latitude = seed.latitude();
            delivery.longitude = seed.longitude();
            delivery.size = seed.size();
            delivery.status = DeliveryStatus.ADDED;
            deliveryRepository.persist(delivery);
            byRef.put(seed.ref(), delivery);
        }
        LOG.infof("Seeded %d deliveries", seeds.size());
        return byRef;
    }

    private void seedTrips(Map<String, Delivery> seededDeliveries) {
        if (tripRepository.count() > 0) {
            LOG.debug("Trips table is not empty – skipping trip seed");
            return;
        }

        List<TripSeed> seeds = read("seed/trips.json", new TypeReference<>() {
        });
        int created = 0;
        for (TripSeed seed : seeds) {
            Vehicle vehicle = vehicleRepository.find("registrationNumber", seed.registrationNumber()).firstResult();
            if (vehicle == null || !vehicle.active) {
                LOG.warnf("Skipping seed trip: vehicle %s does not exist or is inactive", seed.registrationNumber());
                continue;
            }

            List<String> refs = seed.deliveries() == null ? List.of() : seed.deliveries();
            if (!seededDeliveries.keySet().containsAll(refs)) {
                LOG.warnf("Skipping seed trip for %s: its deliveries %s were not seeded in this run",
                        seed.registrationNumber(), refs);
                continue;
            }

            DeliveryStatus deliveryStatus = seed.status() == TripStatus.FINISHED
                    ? DeliveryStatus.DELIVERED
                    : DeliveryStatus.IN_DELIVERY;

            Trip trip = new Trip();
            trip.vehicle = vehicle;
            trip.status = seed.status();
            for (String ref : refs) {
                Delivery delivery = seededDeliveries.get(ref);
                delivery.status = deliveryStatus;
                trip.deliveries.add(delivery);
            }
            tripRepository.persist(trip);
            created++;
        }
        LOG.infof("Seeded %d trips", created);
    }

    private <T> List<T> read(String file, TypeReference<List<T>> type) {
        try (InputStream input = Thread.currentThread().getContextClassLoader().getResourceAsStream(file)) {
            if (input == null) {
                throw new IllegalStateException("Seed file not found on classpath: " + file);
            }
            return objectMapper.readValue(input, type);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read seed file " + file, e);
        }
    }
}
