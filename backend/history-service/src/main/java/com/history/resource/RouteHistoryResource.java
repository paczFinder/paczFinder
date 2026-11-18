package com.history.resource;

import com.history.dto.CreateRouteHistoryRequest;
import com.history.dto.PaginatedResponse;
import com.history.dto.RouteHistoryResponse;
import com.history.security.HistoryAccess;
import com.history.service.RouteHistoryService;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
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
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;

@Path("/history")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class RouteHistoryResource {

    private final RouteHistoryService routeHistoryService;
    private final HistoryAccess historyAccess;
    private final SecurityIdentity identity;
    private final JsonWebToken jwt;

    public RouteHistoryResource(RouteHistoryService routeHistoryService, HistoryAccess historyAccess,
                                SecurityIdentity identity, JsonWebToken jwt) {
        this.routeHistoryService = routeHistoryService;
        this.historyAccess = historyAccess;
        this.identity = identity;
        this.jwt = jwt;
    }

    @POST
    @Path("/routes")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public Response create(@Valid CreateRouteHistoryRequest request) {
        RouteHistoryResponse routeHistory = routeHistoryService.create(request);
        return Response.status(Response.Status.CREATED).entity(routeHistory).build();
    }

    @GET
    @Path("/routes")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public PaginatedResponse<RouteHistoryResponse> findAll(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size
    ) {
        return routeHistoryService.findAll(page, size);
    }

    @GET
    @Path("/routes/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public RouteHistoryResponse findById(@PathParam("id") Long id) {
        historyAccess.requireOwnerForHistory(id, identity);
        return routeHistoryService.findById(id);
    }

    @GET
    @Path("/routes/source-route-plan/{sourceRoutePlanId}")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public RouteHistoryResponse findBySourceRoutePlanId(@PathParam("sourceRoutePlanId") Long sourceRoutePlanId) {
        RouteHistoryResponse response = routeHistoryService.findBySourceRoutePlanId(sourceRoutePlanId);
        if (!historyAccess.isManager(identity)) {
            historyAccess.requireOwnerForHistory(response.id(), identity);
        }
        return response;
    }

    @GET
    @Path("/trips/{tripId}")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public List<RouteHistoryResponse> findByTripId(@PathParam("tripId") Long tripId) {
        if (historyAccess.isManager(identity)) {
            return routeHistoryService.findByTripId(tripId);
        }
        return routeHistoryService.findByTripIdAndCourier(tripId, courierId());
    }

    @GET
    @Path("/trips/{tripId}/latest")
    @RolesAllowed({"ADMIN", "DISPATCHER", "COURIER"})
    public RouteHistoryResponse findLatestByTripId(@PathParam("tripId") Long tripId) {
        if (historyAccess.isManager(identity)) {
            return routeHistoryService.findLatestByTripId(tripId);
        }
        return routeHistoryService.findLatestByTripIdAndCourier(tripId, courierId());
    }

    @DELETE
    @Path("/routes/{id}")
    @RolesAllowed({"ADMIN", "DISPATCHER"})
    public Response delete(@PathParam("id") Long id) {
        routeHistoryService.delete(id);
        return Response.noContent().build();
    }

    private String courierId() {
        String subject = jwt.getSubject();
        return subject != null ? subject : identity.getPrincipal().getName();
    }
}
