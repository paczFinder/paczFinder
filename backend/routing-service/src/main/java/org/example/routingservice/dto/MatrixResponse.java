package org.example.routingservice.dto;

import java.util.List;

public record MatrixResponse(List<String> pointIds, List<List<Double>> durations, List<List<Integer>> distances) {}
