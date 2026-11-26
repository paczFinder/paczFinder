package org.example.routeoptimizationservice.algorithm;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SimulatedAnnealingOptimizerTest {

    private static double[][] buildMatrix(Location depot, List<Location> deliveries) {
        int n = deliveries.size();
        int total = n + 1;
        double[][] matrix = new double[total][total];
        Location[] nodes = new Location[total];
        nodes[0] = depot;
        for (int i = 0; i < n; i++) {
            nodes[i + 1] = deliveries.get(i);
        }
        for (int i = 0; i < total; i++) {
            for (int j = 0; j < total; j++) {
                matrix[i][j] = i == j ? 0.0 : haversine(nodes[i], nodes[j]);
            }
        }
        return matrix;
    }

    private static double haversine(Location a, Location b) {
        double lat1 = Math.toRadians(a.latitude());
        double lat2 = Math.toRadians(b.latitude());
        double dLat = Math.toRadians(b.latitude() - a.latitude());
        double dLon = Math.toRadians(b.longitude() - a.longitude());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        return 6371000.0 * c;
    }

    @Test
    @DisplayName("SA powinien zwrócić rozwiązanie dla prostego przypadku")
    void shouldReturnSolutionForSimpleCase() {
        Location depot = new Location(0, 52.2297, 21.0122, 0);
        List<Location> deliveries = List.of(
                new Location(1, 52.2300, 21.0125, 1),
                new Location(2, 52.2295, 21.0120, 1)
        );
        List<Integer> capacities = List.of(10);

        SimulatedAnnealingOptimizer optimizer = new SimulatedAnnealingOptimizer(42L);
        Solution solution = optimizer.optimize(depot, deliveries, capacities, buildMatrix(depot, deliveries));

        assertNotNull(solution);
        assertFalse(solution.routes().isEmpty());
        assertTrue(solution.totalCost() >= 0);
    }

    @Test
    @DisplayName("SA powinien szanować pojemność pojazdów")
    void shouldRespectVehicleCapacity() {
        Location depot = new Location(0, 52.2297, 21.0122, 0);
        List<Location> deliveries = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            deliveries.add(new Location(i + 1, 52.2297 + i * 0.001, 21.0122 + i * 0.001, 5));
        }
        List<Integer> capacities = List.of(10, 10);

        SimulatedAnnealingOptimizer optimizer = new SimulatedAnnealingOptimizer(42L);
        Solution solution = optimizer.optimize(depot, deliveries, capacities, buildMatrix(depot, deliveries));

        assertNotNull(solution);
        assertTrue(solution.routes().size() <= capacities.size(),
                "Liczba tras nie powinna przekraczać liczby pojazdów");
        int totalDelivered = solution.routes().stream().mapToInt(List::size).sum();
        assertTrue(totalDelivered <= deliveries.size(), "Nie można dostarczyć więcej niż jest dostaw");
    }

    @Test
    @DisplayName("Puste dostawy powinny zwrócić puste rozwiązanie")
    void shouldHandleEmptyDeliveries() {
        Location depot = new Location(0, 52.2297, 21.0122, 0);
        List<Location> deliveries = List.of();
        List<Integer> capacities = List.of(10);

        SimulatedAnnealingOptimizer optimizer = new SimulatedAnnealingOptimizer(42L);
        Solution solution = optimizer.optimize(depot, deliveries, capacities, buildMatrix(depot, deliveries));

        assertNotNull(solution);
        assertEquals(0.0, solution.totalCost(), 0.001);
    }

    @Test
    @DisplayName("Kolejne uruchomienia z tym samym seedem powinny dać podobne wyniki")
    void shouldBeDeterministicWithSameSeed() {
        Location depot = new Location(0, 52.2297, 21.0122, 0);
        List<Location> deliveries = List.of(
                new Location(1, 52.2300, 21.0125, 1),
                new Location(2, 52.2295, 21.0120, 1),
                new Location(3, 52.2305, 21.0130, 2)
        );
        List<Integer> capacities = List.of(10);

        SimulatedAnnealingOptimizer opt1 = new SimulatedAnnealingOptimizer(42L);
        SimulatedAnnealingOptimizer opt2 = new SimulatedAnnealingOptimizer(42L);

        Solution s1 = opt1.optimize(depot, deliveries, capacities, buildMatrix(depot, deliveries));
        Solution s2 = opt2.optimize(depot, deliveries, capacities, buildMatrix(depot, deliveries));

        assertEquals(s1.totalCost(), s2.totalCost(), 0.001);
    }
}
