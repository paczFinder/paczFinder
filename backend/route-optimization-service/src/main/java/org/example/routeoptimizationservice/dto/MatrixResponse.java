package org.example.routeoptimizationservice.dto;

import java.util.List;

public record MatrixResponse(
        List<String> pointIds,
        List<List<Double>> durations,
        List<List<Integer>> distances
) {
}
