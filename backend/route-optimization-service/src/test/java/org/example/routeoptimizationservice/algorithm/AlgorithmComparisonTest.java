package org.example.routeoptimizationservice.algorithm;

import org.example.routeoptimizationservice.algorithm.RouteScenarios.Scenario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Supplier;

import static org.example.routeoptimizationservice.algorithm.RouteScenarios.DEPOT;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Porównanie ACO, SA i brute force (BF) na tych samych scenariuszach z {@link RouteScenarios}.
 */
class AlgorithmComparisonTest {

    private static final long SEED = 42L;
    private static final int BRUTE_FORCE_MAX_PACKAGES = 10;

    private static final String ROW = "  %-16s | %6s | %10s | %8s | %8s | %8s | %8s | %8s | %8s | %-20s | %-21s%n";

    /** Wynik jednego uruchomienia algorytmu. */
    private record Run(Solution solution, long millis) {

        String km() {
            return String.format(Locale.ROOT, "%.2f", solution.totalCost() / 1000);
        }

        int delivered() {
            return solution.routes().stream().mapToInt(List::size).sum();
        }
    }

    @Test
    @DisplayName("Porównanie ACO, SA i brute force na stałych scenariuszach")
    void shouldCompareAlgorithms() {
        System.out.println();
        System.out.printf(ROW, "Scenariusz", "Paczki", "Auta x poj", "ACO [km]", "SA [km]", "BF [km]",
                "ACO [ms]", "SA [ms]", "BF [ms]", "Auta użyte ACO/SA/BF", "Dostarczone ACO/SA/BF");

        for (Scenario scenario : RouteScenarios.ALL) {
            List<Location> deliveries = scenario.deliveries();
            List<Integer> capacities = scenario.capacities();
            double[][] matrix = scenario.costMatrix();

            Run aco = run(scenario, () -> new AntColonyOptimizer(SEED).optimize(DEPOT, deliveries, capacities, matrix));
            Run sa = run(scenario, () -> new SimulatedAnnealingOptimizer(SEED).optimize(DEPOT, deliveries, capacities, matrix));
            Run bf = scenario.packages() <= BRUTE_FORCE_MAX_PACKAGES
                    ? run(scenario, () -> new BruteForceOptimizer().optimize(DEPOT, deliveries, capacities, matrix))
                    : null;

            System.out.printf(ROW, scenario.name(), scenario.packages(), scenario.vehicles() + " x " + scenario.capacity(),
                    aco.km(), sa.km(), bf == null ? "—" : bf.km(),
                    aco.millis(), sa.millis(), bf == null ? "—" : bf.millis(),
                    aco.solution().routes().size() + " / " + sa.solution().routes().size() + " / "
                            + (bf == null ? "—" : bf.solution().routes().size()),
                    aco.delivered() + " / " + sa.delivered() + " / " + (bf == null ? "—" : bf.delivered()));
        }
        System.out.println();
    }

    /** Mierzy czas algorytmu i sprawdza poprawność wyniku. */
    private static Run run(Scenario scenario, Supplier<Solution> algorithm) {
        long start = System.nanoTime();
        Solution solution = algorithm.get();
        long millis = (System.nanoTime() - start) / 1_000_000;
        assertValid(solution, scenario);
        return new Run(solution, millis);
    }

    /** Trasy mieszczą się w autach, żadna paczka nie jest dostarczona dwa razy, koszt zgadza się z macierzą. */
    private static void assertValid(Solution solution, Scenario scenario) {
        List<Location> deliveries = scenario.deliveries();
        double[][] matrix = scenario.costMatrix();

        assertTrue(solution.routes().size() <= scenario.vehicles(), "Liczba tras nie powinna przekraczać liczby aut");
        Set<Integer> visited = new HashSet<>();
        double expectedCost = 0.0;
        for (List<Integer> route : solution.routes()) {
            int load = 0;
            int prev = 0;
            for (int node : route) {
                assertTrue(visited.add(node), "Paczka " + node + " dostarczona więcej niż raz");
                load += deliveries.get(node - 1).loadUnits();
                expectedCost += matrix[prev][node];
                prev = node;
            }
            expectedCost += matrix[prev][0];
            assertTrue(load <= scenario.capacity(), "Trasa przekracza pojemność auta");
        }
        assertEquals(expectedCost, solution.totalCost(), 1e-6);
    }
}
