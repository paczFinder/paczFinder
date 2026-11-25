package com.delivery.resource;

import com.delivery.dto.CreateDeliveryRequest;
import com.delivery.dto.DeliveryFilter;
import com.delivery.dto.DeliveryResponse;
import com.delivery.dto.PaginatedResponse;
import com.delivery.dto.UpdateDeliveryStatusRequest;
import com.delivery.security.TripAccess;
import com.delivery.service.DeliveryService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/deliveries")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class DeliveryResource {

    private final DeliveryService deliveryService;
    private final TripAccess tripAccess;
    private final SecurityIdentity identity;

    public DeliveryResource(DeliveryService deliveryService, TripAccess tripAccess, SecurityIdentity identity) {
        this.deliveryService = deliveryService;
        this.tripAccess = tripAccess;
        this.identity = identity;
    }

    @GET
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public PaginatedResponse<DeliveryResponse> findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("status")
            @Pattern(regexp = "(?i)|ADDED|IN_DELIVERY|DELIVERED",
                    message = "Invalid status. Allowed: ADDED, IN_DELIVERY, DELIVERED") String status,
            @QueryParam("deliverySize")
            @Pattern(regexp = "(?i)|S|M|L", message = "Invalid deliverySize. Allowed: S, M, L") String deliverySize,
            @QueryParam("sort") @DefaultValue("id")
            @Pattern(regexp = "id|recipientName|city",
                    message = "Cannot sort by this field. Allowed: id, recipientName, city") String sort,
            @QueryParam("direction") @DefaultValue("asc")
            @Pattern(regexp = "(?i)asc|desc", message = "Sort direction must be 'asc' or 'desc'") String direction
    ) {
        return deliveryService.findAll(page, size, new DeliveryFilter(search, status, deliverySize, sort, direction));
    }

    @GET
    @Path("/available")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public PaginatedResponse<DeliveryResponse> findAvailable(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("search") String search,
            @QueryParam("status")
            @Pattern(regexp = "(?i)|ADDED|IN_DELIVERY|DELIVERED",
                    message = "Invalid status. Allowed: ADDED, IN_DELIVERY, DELIVERED") String status,
            @QueryParam("deliverySize")
            @Pattern(regexp = "(?i)|S|M|L", message = "Invalid deliverySize. Allowed: S, M, L") String deliverySize,
            @QueryParam("sort") @DefaultValue("id")
            @Pattern(regexp = "id|recipientName|city",
                    message = "Cannot sort by this field. Allowed: id, recipientName, city") String sort,
            @QueryParam("direction") @DefaultValue("asc")
            @Pattern(regexp = "(?i)asc|desc", message = "Sort direction must be 'asc' or 'desc'") String direction
    ) {
        return deliveryService.findAvailable(page, size, new DeliveryFilter(search, status, deliverySize, sort, direction));
    }

    @GET
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public DeliveryResponse findById(@PathParam("id") Long id) {
        tripAccess.requireCourierOwnsDelivery(id, identity);
        return deliveryService.findById(id);
    }

    @POST
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public Response create(@Valid CreateDeliveryRequest request) {
        DeliveryResponse delivery = deliveryService.create(request);
        return Response.status(Response.Status.CREATED).entity(delivery).build();
    }

    @PUT
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public DeliveryResponse update(@PathParam("id") Long id, @Valid CreateDeliveryRequest request) {
        return deliveryService.update(id, request);
    }

    @PATCH
    @Path("/{id}/status")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public DeliveryResponse updateStatus(@PathParam("id") Long id, @Valid UpdateDeliveryStatusRequest request) {
        tripAccess.requireCourierOwnsDelivery(id, identity);
        return deliveryService.updateStatus(id, request.status());
    }

    @DELETE
    @Path("/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public Response delete(@PathParam("id") Long id) {
        deliveryService.delete(id);
        return Response.noContent().build();
    }
}