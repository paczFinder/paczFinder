package org.example.routeoptimizationservice.client;

import org.example.routeoptimizationservice.dto.MatrixResponse;
import org.example.routeoptimizationservice.dto.PointDto;
import org.example.routeoptimizationservice.dto.RouteResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "routing-client")
public interface RoutingClient {

    @PostMapping("/api/v1/routing/matrix")
    MatrixResponse matrix(@RequestBody MatrixRequestBody body);

    @PostMapping("/api/v1/routing/route")
    RouteResponseDto route(@RequestBody RouteRequestBody body);

    record MatrixRequestBody(List<PointDto> points) {}

    record RouteRequestBody(List<PointDto> orderedPoints) {}
}
