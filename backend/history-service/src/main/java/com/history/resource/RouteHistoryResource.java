package com.history.resource;

import com.history.dto.CreateRouteHistoryRequest;
import com.history.dto.PaginatedResponse;
import com.history.dto.RouteHistoryResponse;
import com.history.service.RouteHistoryService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/history")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RouteHistoryResource {

    private final RouteHistoryService routeHistoryService;

    public RouteHistoryResource(RouteHistoryService routeHistoryService) {
        this.routeHistoryService = routeHistoryService;
    }

    @POST
    @Path("/routes")
    public Response create(@Valid CreateRouteHistoryRequest request) {
        RouteHistoryResponse routeHistory = routeHistoryService.create(request);

        return Response.status(Response.Status.CREATED)
                .entity(routeHistory)
                .build();
    }

    @GET
    @Path("/routes")
    public PaginatedResponse<RouteHistoryResponse> findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size
    ) {
        return routeHistoryService.findAll(page, size);
    }

    @GET
    @Path("/routes/{id}")
    public RouteHistoryResponse findById(@PathParam("id") Long id) {
        return routeHistoryService.findById(id);
    }

    @GET
    @Path("/routes/source-route-plan/{sourceRoutePlanId}")
    public RouteHistoryResponse findBySourceRoutePlanId(@PathParam("sourceRoutePlanId") Long sourceRoutePlanId) {
        return routeHistoryService.findBySourceRoutePlanId(sourceRoutePlanId);
    }

    @GET
    @Path("/trips/{tripId}")
    public List<RouteHistoryResponse> findByTripId(@PathParam("tripId") Long tripId) {
        return routeHistoryService.findByTripId(tripId);
    }

    @GET
    @Path("/trips/{tripId}/latest")
    public RouteHistoryResponse findLatestByTripId(@PathParam("tripId") Long tripId) {
        return routeHistoryService.findLatestByTripId(tripId);
    }

    @DELETE
    @Path("/routes/{id}")
    public Response delete(@PathParam("id") Long id) {
        routeHistoryService.delete(id);
        return Response.noContent().build();
    }
}
