package org.example.routeoptimizationservice.client;

import org.example.routeoptimizationservice.dto.CreateRouteHistoryRequest;
import org.example.routeoptimizationservice.dto.RouteHistoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "history-client", url = "${history.base-url}")
public interface HistoryClient {

    @PostMapping("/history/routes")
    RouteHistoryResponse create(@RequestBody CreateRouteHistoryRequest request);
}
