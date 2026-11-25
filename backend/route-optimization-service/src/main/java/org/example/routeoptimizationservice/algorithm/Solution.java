package org.example.routeoptimizationservice.algorithm;

import java.util.List;

public record Solution(List<List<Integer>> routes, double totalCost) {
    public Solution {
        routes = List.copyOf(routes);
    }
}
