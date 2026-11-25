package com.delivery.resource;

import com.delivery.dto.AddDeliveriesToTripRequest;
import com.delivery.dto.AddDeliveryToTripRequest;
import com.delivery.dto.ChangeTripVehicleRequest;
import com.delivery.dto.CreateTripRequest;
import com.delivery.dto.DeliveryResponse;
import com.delivery.dto.PaginatedResponse;
import com.delivery.dto.TripFilter;
import com.delivery.dto.TripResponse;
import com.delivery.security.TripAccess;
import com.delivery.service.TripService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/trips")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TripResource {

    private final TripService tripService;
    private final TripAccess tripAccess;
    private final SecurityIdentity identity;

    public TripResource(TripService tripService, TripAccess tripAccess, SecurityIdentity identity) {
        this.tripService = tripService;
        this.tripAccess = tripAccess;
        this.identity = identity;
    }

    @GET
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public PaginatedResponse<TripResponse> findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("status")
            @Pattern(regexp = "(?i)|ADDED|FINISHED", message = "Invalid status. Allowed: ADDED, FINISHED") String status,
            @QueryParam("sort") @DefaultValue("id")
            @Pattern(regexp = "id|vehicle\\.registrationNumber|vehicle\\.brand",
                    message = "Cannot sort by this field. Allowed: id, vehicle.registrationNumber, vehicle.brand") String sort,
            @QueryParam("direction") @DefaultValue("asc")
            @Pattern(regexp = "(?i)asc|desc", message = "Sort direction must be 'asc' or 'desc'") String direction
    ) {
        return tripService.findAll(page, size, new TripFilter(search, status, sort, direction));
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public TripResponse findById(@PathParam("id") Long id) {
        tripAccess.requireCourierOwnsTrip(id, identity);
        return tripService.findById(id);
    }

    @GET
    @Path("/{id}/deliveries")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public List<DeliveryResponse> findDeliveries(@PathParam("id") Long id) {
        tripAccess.requireCourierOwnsTrip(id, identity);
        return tripService.findDeliveries(id);
    }

    @POST
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public Response create(@Valid CreateTripRequest request) {
        TripResponse trip = tripService.create(request);

        return Response.status(Response.Status.CREATED)
                .entity(trip)
                .build();
    }

    @PATCH
    @Path("/{id}/vehicle")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public TripResponse changeVehicle(
            @PathParam("id") Long id,
            @Valid ChangeTripVehicleRequest request
    ) {
        return tripService.changeVehicle(id, request);
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public Response delete(@PathParam("id") Long id) {
        tripService.delete(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/deliveries")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public TripResponse addDelivery(
            @PathParam("id") Long tripId,
            @Valid AddDeliveryToTripRequest request
    ) {
        return tripService.addDelivery(tripId, request);
    }

    @POST
    @Path("/{id}/deliveries/batch")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public TripResponse addDeliveries(
            @PathParam("id") Long id,
            @Valid AddDeliveriesToTripRequest request
    ) {
        return tripService.addDeliveries(id, request);
    }

    @POST
    @Path("/{id}/finish")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public TripResponse finish(@PathParam("id") Long id) {
        tripAccess.requireCourierOwnsTrip(id, identity);
        return tripService.finish(id);
    }
}
