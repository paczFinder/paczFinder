package org.example.routingservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.routingservice.config.OsrmProperties;
import org.example.routingservice.dto.MatrixRequest;
import org.example.routingservice.dto.MatrixResponse;
import org.example.routingservice.dto.Point;
import org.example.routingservice.dto.RouteRequest;
import org.example.routingservice.dto.RouteResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Component
public class OsrmClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final OsrmProperties properties;

    public OsrmClient(OsrmProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public MatrixResponse getMatrix(MatrixRequest request) {
        StringBuilder coords = new StringBuilder();
        for (Point p : request.points()) {
            if (coords.length() > 0) {
                coords.append(';');
            }
            coords.append(p.lon()).append(',').append(p.lat());
        }

        String url = properties.getBaseUrl() + "/table/v1/driving/" + coords + "?annotations=duration,distance";

        try {
            String json = restTemplate.getForObject(url, String.class);
            if (json == null) {
                throw new RuntimeException("OSRM returned empty matrix response");
            }
            JsonNode root = objectMapper.readTree(json);
            JsonNode durations = root.path("durations");
            JsonNode distances = root.path("distances");

            List<String> pointIds = request.points().stream().map(Point::id).toList();

            List<List<Double>> durList = toDoubleList(durations);
            List<List<Integer>> distList = toIntList(distances);

            return new MatrixResponse(pointIds, durList, distList);
        } catch (Exception ex) {
            throw new RuntimeException("OSRM matrix request failed", ex);
        }
    }

    public RouteResponse getRoute(RouteRequest request) {
        StringBuilder coords = new StringBuilder();
        for (Point p : request.orderedPoints()) {
            if (coords.length() > 0) {
                coords.append(';');
            }
            coords.append(p.lon()).append(',').append(p.lat());
        }

        String url = properties.getBaseUrl() + "/route/v1/driving/" + coords + "?overview=full&geometries=geojson";

        try {
            String json = restTemplate.getForObject(url, String.class);
            if (json == null) {
                throw new RuntimeException("OSRM returned empty route response");
            }
            JsonNode root = objectMapper.readTree(json);
            JsonNode routes = root.path("routes");
            if (routes.isMissingNode() || routes.size() == 0) {
                throw new RuntimeException("OSRM returned no routes");
            }
            JsonNode route = routes.get(0);
            double distance = route.path("distance").asDouble();
            double duration = route.path("duration").asDouble();
            JsonNode geometry = route.path("geometry").path("coordinates");

            List<List<Double>> coordinates = toDoubleList(geometry);

            return new RouteResponse(
                    (long) Math.round(distance),
                    (long) Math.round(duration),
                    new RouteResponse.Geometry("LineString", coordinates)
            );
        } catch (Exception ex) {
            throw new RuntimeException("OSRM route request failed", ex);
        }
    }

    private List<List<Double>> toDoubleList(JsonNode node) {
        List<List<Double>> result = new ArrayList<>();
        for (JsonNode row : node) {
            List<Double> inner = new ArrayList<>();
            for (JsonNode val : row) {
                inner.add(val.asDouble());
            }
            result.add(inner);
        }
        return result;
    }

    private List<List<Integer>> toIntList(JsonNode node) {
        List<List<Integer>> result = new ArrayList<>();
        for (JsonNode row : node) {
            List<Integer> inner = new ArrayList<>();
            for (JsonNode val : row) {
                inner.add(val.asInt());
            }
            result.add(inner);
        }
        return result;
    }
}
