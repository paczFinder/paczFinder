package org.example.routeoptimizationservice.client;

import org.example.routeoptimizationservice.dto.DeliveryDto;
import org.example.routeoptimizationservice.dto.VehicleDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "delivery-client")
public interface DeliveryClient {

    @GetMapping("/deliveries/available")
    List<DeliveryDto> getAvailableDeliveries(
            @RequestParam("page") int page,
            @RequestParam("size") int size
    );

    @GetMapping("/vehicles")
    List<VehicleDto> getVehicles(
            @RequestParam("page") int page,
            @RequestParam("size") int size
    );

}
