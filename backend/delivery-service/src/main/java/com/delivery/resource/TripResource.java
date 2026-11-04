package com.delivery.resource;

import com.delivery.dto.AddDeliveriesToTripRequest;
import com.delivery.dto.AddDeliveryToTripRequest;
import com.delivery.dto.ChangeTripVehicleRequest;
import com.delivery.dto.CreateTripRequest;
import com.delivery.dto.DeliveryResponse;
import com.delivery.dto.PaginatedResponse;
import com.delivery.dto.TripResponse;
import com.delivery.service.TripService;
import jakarta.validation.Valid;
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

    public TripResource(TripService tripService) {
        this.tripService = tripService;
    }

    @GET
    public PaginatedResponse<TripResponse> findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size
    ) {
        return tripService.findAll(page, size);
    }

    @GET
    @Path("/{id}")
    public TripResponse findById(@PathParam("id") Long id) {
        return tripService.findById(id);
    }

    @GET
    @Path("/{id}/deliveries")
    public List<DeliveryResponse> findDeliveries(@PathParam("id") Long id) {
        return tripService.findDeliveries(id);
    }

    @POST
    public Response create(@Valid CreateTripRequest request) {
        TripResponse trip = tripService.create(request);

        return Response.status(Response.Status.CREATED)
                .entity(trip)
                .build();
    }

    @PATCH
    @Path("/{id}/vehicle")
    public TripResponse changeVehicle(
            @PathParam("id") Long id,
            @Valid ChangeTripVehicleRequest request
    ) {
        return tripService.changeVehicle(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        tripService.delete(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/deliveries")
    public TripResponse addDelivery(
            @PathParam("id") Long tripId,
            @Valid AddDeliveryToTripRequest request
    ) {
        return tripService.addDelivery(tripId, request);
    }

    @POST
    @Path("/{id}/deliveries/batch")
    public TripResponse addDeliveries(
            @PathParam("id") Long id,
            @Valid AddDeliveriesToTripRequest request
    ) {
        return tripService.addDeliveries(id, request);
    }

    @POST
    @Path("/{id}/finish")
    public TripResponse finish(@PathParam("id") Long id) {
        return tripService.finish(id);
    }
}
