package org.example.routingservice.service;

import org.example.routingservice.dto.Point;
import org.springframework.stereotype.Component;

@Component
public class HaversineFallback {

    private static final double EARTH_RADIUS_M = 6371000.0;
    static final double CITY_DETOUR_FACTOR = 1.35;
    static final double AVG_SPEED_MPS = 11.11;

    public double[][] fallbackDurations(Point[] points) {
        int n = points.length;
        double[][] durations = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    durations[i][j] = 0.0;
                } else {
                    double distanceM = haversineMeters(points[i], points[j]);
                    durations[i][j] = (distanceM * CITY_DETOUR_FACTOR) / AVG_SPEED_MPS;
                }
            }
        }
        return durations;
    }

    public int[][] fallbackDistances(Point[] points) {
        int n = points.length;
        int[][] distances = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    distances[i][j] = 0;
                } else {
                    distances[i][j] = (int) Math.round(haversineMeters(points[i], points[j]) * CITY_DETOUR_FACTOR);
                }
            }
        }
        return distances;
    }

    public double haversineMeters(Point a, Point b) {
        double lat1 = Math.toRadians(a.lat());
        double lat2 = Math.toRadians(b.lat());
        double dLat = Math.toRadians(b.lat() - a.lat());
        double dLon = Math.toRadians(b.lon() - a.lon());

        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        return EARTH_RADIUS_M * c;
    }
}
