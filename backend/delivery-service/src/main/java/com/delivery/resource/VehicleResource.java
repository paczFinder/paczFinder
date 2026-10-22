package com.delivery.resource;

import com.delivery.dto.AssignCourierRequest;
import com.delivery.dto.CreateVehicleRequest;
import com.delivery.dto.VehicleResponse;
import com.delivery.service.VehicleService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/vehicles")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class VehicleResource {

    private final VehicleService vehicleService;

    public VehicleResource(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GET
    public List<VehicleResponse> findAll() {
        return vehicleService.findAll();
    }

    @GET
    @Path("/{id}")
    public VehicleResponse findById(@PathParam("id") Long id) {
        return vehicleService.findById(id);
    }

    @POST
    public Response create(@Valid CreateVehicleRequest request) {
        VehicleResponse vehicle = vehicleService.create(request);

        return Response.status(Response.Status.CREATED)
                .entity(vehicle)
                .build();
    }

    @PUT
    @Path("/{id}")
    public VehicleResponse update(
            @PathParam("id") Long id,
            @Valid CreateVehicleRequest request
    ) {
        return vehicleService.update(id, request);
    }

    @PATCH
    @Path("/{id}/courier")
    public VehicleResponse assignCourier(
            @PathParam("id") Long id,
            @Valid AssignCourierRequest request
    ) {
        return vehicleService.assignCourier(id, request);
    }

    @DELETE
    @Path("/{id}/courier")
    public VehicleResponse unassignCourier(@PathParam("id") Long id) {
        return vehicleService.unassignCourier(id);
    }

    @DELETE
    @Path("/{id}/deactivate")
    public Response deactivate(@PathParam("id") Long id) {
        vehicleService.deactivate(id);
        return Response.noContent().build();
    }

    @PATCH
    @Path("/{id}/activate")
    public Response activate(@PathParam("id") Long id) {
        vehicleService.activate(id);
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        vehicleService.delete(id);
        return Response.noContent().build();
    }
}
