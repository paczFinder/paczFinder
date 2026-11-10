package org.example.routingservice.service;

import org.example.routingservice.dto.MatrixRequest;
import org.example.routingservice.dto.MatrixResponse;
import org.example.routingservice.dto.Point;
import org.example.routingservice.dto.RouteRequest;
import org.example.routingservice.dto.RouteResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoutingService {

    private final OsrmClient osrmClient;
    private final HaversineFallback fallback;

    public RoutingService(OsrmClient osrmClient, HaversineFallback fallback) {
        this.osrmClient = osrmClient;
        this.fallback = fallback;
    }

    public MatrixResponse matrix(MatrixRequest request) {
        try {
            return osrmClient.getMatrix(request);
        } catch (Exception ex) {
            Point[] points = request.points().toArray(new Point[0]);
            double[][] durations = fallback.fallbackDurations(points);
            int[][] distances = fallback.fallbackDistances(points);

            List<String> pointIds = request.points().stream().map(Point::id).toList();
            List<List<Double>> durList = toList(durations);
            List<List<Integer>> distList = toList(distances);

            return new MatrixResponse(pointIds, durList, distList);
        }
    }

    public RouteResponse route(RouteRequest request) {
        try {
            return osrmClient.getRoute(request);
        } catch (Exception ex) {
            List<Point> points = request.orderedPoints();
            double totalDistanceM = 0;
            double totalDurationS = 0;

            for (int i = 0; i < points.size() - 1; i++) {
                double d = fallback.haversineMeters(points.get(i), points.get(i + 1));
                totalDistanceM += d * HaversineFallback.CITY_DETOUR_FACTOR;
                totalDurationS += (d * HaversineFallback.CITY_DETOUR_FACTOR) / HaversineFallback.AVG_SPEED_MPS;
            }

            List<List<Double>> coordinates = points.stream()
                    .map(p -> List.of(p.lon(), p.lat()))
                    .toList();

            return new RouteResponse(
                    (long) Math.round(totalDistanceM),
                    (long) Math.round(totalDurationS),
                    new RouteResponse.Geometry("LineString", coordinates)
            );
        }
    }

    private List<List<Double>> toList(double[][] array) {
        List<List<Double>> result = new ArrayList<>();
        for (double[] row : array) {
            List<Double> inner = new ArrayList<>();
            for (double v : row) {
                inner.add(v);
            }
            result.add(inner);
        }
        return result;
    }

    private List<List<Integer>> toList(int[][] array) {
        List<List<Integer>> result = new ArrayList<>();
        for (int[] row : array) {
            List<Integer> inner = new ArrayList<>();
            for (int v : row) {
                inner.add(v);
            }
            result.add(inner);
        }
        return result;
    }
}
