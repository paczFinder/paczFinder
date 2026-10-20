package com.delivery.resource;

import com.delivery.dto.CreateDeliveryRequest;
import com.delivery.dto.DeliveryResponse;
import com.delivery.service.DeliveryService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PathParam;

import java.util.List;

@Path("/deliveries")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DeliveryResource {

    private final DeliveryService deliveryService;

    public DeliveryResource(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GET
    public List<DeliveryResponse> findAll() {
        return deliveryService.findAll();
    }

    @GET
    @Path("/available")
    public List<DeliveryResponse> findAvailable() {
        return deliveryService.findAvailable();
    }

    @GET
    @Path("/{id}")
    public DeliveryResponse findById(@PathParam("id") Long id) {
        return deliveryService.findById(id);
    }

    @POST
    public Response create(@Valid CreateDeliveryRequest request) {
        DeliveryResponse delivery = deliveryService.create(request);

        return Response.status(Response.Status.CREATED)
                .entity(delivery)
                .build();
    }

    @PUT
    @Path("/{id}")
    public DeliveryResponse update(
            @PathParam("id") Long id,
            @Valid CreateDeliveryRequest request
    ) {
        return deliveryService.update(id, request);
    }

}
