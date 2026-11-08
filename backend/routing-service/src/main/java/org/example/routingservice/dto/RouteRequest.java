package org.example.routingservice.dto;

import java.util.List;

public record RouteRequest(List<Point> orderedPoints) {}
