package org.example.routeoptimizationservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@EnableAsync
public class RouteOptimizationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RouteOptimizationServiceApplication.class, args);

    }

}
