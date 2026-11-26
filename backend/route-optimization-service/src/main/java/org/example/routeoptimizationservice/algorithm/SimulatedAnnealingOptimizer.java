package org.example.routeoptimizationservice.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Component;

/**
 * Wyżarzanie symulowane (Simulated Annealing) – wersja podstawowa:
 *  1. rozwiązanie startowe: paczki w losowej kolejności ładowane po kolei do aut,
 *  2. ruch: zamiana miejscami dwóch losowych paczek,
 *  3. lepsze rozwiązanie przyjmujemy zawsze, gorsze z prawdopodobieństwem exp(-delta / T),
 *  4. temperatura maleje geometrycznie (T = T * COOLING_RATE) aż do temperatury minimalnej.
 * Zwracane jest najlepsze rozwiązanie znalezione w trakcie działania.
 */
@Component
public class SimulatedAnnealingOptimizer {

    private static final int DEPOT_INDEX = 0;
    private static final double INITIAL_TEMPERATURE_RATIO = 0.1;   // T0 = 10% kosztu rozwiązania startowego
    private static final double MIN_TEMPERATURE_RATIO = 1e-4;      // stop, gdy T < T0 * MIN_TEMPERATURE_RATIO
    private static final double COOLING_RATE = 0.99;               // współczynnik schładzania
    private static final int ITERATIONS_PER_TEMPERATURE = 1000;    // liczba prób ruchu na jednym poziomie temperatury

    private final Random random;

    public SimulatedAnnealingOptimizer() {
        this.random = new Random();
    }

    public SimulatedAnnealingOptimizer(long seed) {
        this.random = new Random(seed);
    }

    public Solution optimize(Location depot, List<Location> deliveries, List<Integer> vehicleCapacities, double[][] costMatrix) {
        int n = deliveries.size();
        int totalNodes = n + 1;

        // Budujemy wspólną tablicę węzłów: indeks 0 to magazyn, 1..n to dostawy
        Location[] allNodes = new Location[totalNodes];
        allNodes[DEPOT_INDEX] = depot;
        for (int i = 0; i < n; i++) {
            allNodes[i + 1] = deliveries.get(i);
        }

        // Macierz kosztów przekazana z zewnątrz (dystans/czas/paliwo w zależności od kryterium optymalizacji)
        double[][] distances = costMatrix;

        // Zapotrzebowanie na ładunek: depot ma 0, reszta ma loadUnits z dostawy
        int[] demands = new int[totalNodes];
        demands[DEPOT_INDEX] = 0;
        for (int i = 0; i < n; i++) {
            demands[i + 1] = deliveries.get(i).loadUnits();
        }

        int[] capacities = vehicleCapacities.stream().mapToInt(Integer::intValue).toArray();

        // Rozwiązanie startowe (losowe)
        List<List<Integer>> current = randomRoutes(demands, capacities);
        if (current.isEmpty()) {
            return new Solution(List.of(), 0.0);
        }
        double currentCost = totalCost(current, distances);

        List<List<Integer>> best = copy(current);
        double bestCost = currentCost;

        double temperature = INITIAL_TEMPERATURE_RATIO * currentCost;
        double minTemperature = temperature * MIN_TEMPERATURE_RATIO;

        // Główna pętla wyżarzania
        while (temperature > minTemperature) {
            for (int i = 0; i < ITERATIONS_PER_TEMPERATURE; i++) {
                List<List<Integer>> candidate = swapTwoPackages(current, demands, capacities);
                if (candidate == null) {
                    continue; // zamiana przekroczyłaby pojemność auta
                }

                double delta = totalCost(candidate, distances) - currentCost;

                // Kryterium Metropolisa: lepsze zawsze, gorsze z prawdopodobieństwem exp(-delta / T)
                if (delta <= 0 || random.nextDouble() < Math.exp(-delta / temperature)) {
                    current = candidate;
                    currentCost += delta;

                    // Zapamiętujemy najlepsze rozwiązanie dotychczas
                    if (currentCost < bestCost) {
                        best = copy(current);
                        bestCost = currentCost;
                    }
                }
            }

            // Schładzanie
            temperature *= COOLING_RATE;
        }

        return new Solution(best, totalCost(best, distances));
    }

    /**
     * Losowe rozwiązanie startowe: paczki w losowej kolejności ładowane po kolei do aut.
     * Gdy paczka nie mieści się w bieżącym aucie, przechodzimy do następnego.
     * Gdy skończą się auta, pozostałe paczki zostają nieobsłużone.
     */
    private List<List<Integer>> randomRoutes(int[] demands, int[] capacities) {
        List<Integer> packages = new ArrayList<>();
        for (int i = 1; i < demands.length; i++) {
            packages.add(i);
        }
        Collections.shuffle(packages, random);

        List<List<Integer>> routes = new ArrayList<>();
        List<Integer> route = new ArrayList<>();
        int vehicle = 0;
        int load = 0;

        for (int node : packages) {
            if (load + demands[node] > capacities[vehicle]) {
                if (route.isEmpty()) {
                    continue; // paczka większa niż puste auto – zostaje w magazynie
                }
                // Auto pełne – wraca do magazynu, rusza następne
                routes.add(route);
                vehicle++;
                if (vehicle == capacities.length) {
                    return routes;
                }
                route = new ArrayList<>();
                load = 0;
                if (demands[node] > capacities[vehicle]) {
                    continue;
                }
            }
            route.add(node);
            load += demands[node];
        }
        if (!route.isEmpty()) {
            routes.add(route);
        }
        return routes;
    }

    /**
     * Ruch: zamiana miejscami dwóch losowych paczek (w tej samej trasie albo w dwóch różnych).
     * Kopiowane są tylko zmieniane trasy. Zwraca null, gdy zamiana przekroczyłaby pojemność auta.
     */
    private List<List<Integer>> swapTwoPackages(List<List<Integer>> routes, int[] demands, int[] capacities) {
        int a = random.nextInt(routes.size());
        int b = random.nextInt(routes.size());
        List<Integer> routeA = new ArrayList<>(routes.get(a));
        List<Integer> routeB = a == b ? routeA : new ArrayList<>(routes.get(b));

        int i = random.nextInt(routeA.size());
        int j = random.nextInt(routeB.size());
        int node = routeA.get(i);
        routeA.set(i, routeB.get(j));
        routeB.set(j, node);

        if (load(routeA, demands) > capacities[a] || load(routeB, demands) > capacities[b]) {
            return null;
        }

        List<List<Integer>> result = new ArrayList<>(routes);
        result.set(a, routeA);
        result.set(b, routeB);
        return result;
    }

    /** Łączny koszt tras: dla każdej magazyn -> paczki -> magazyn. */
    private double totalCost(List<List<Integer>> routes, double[][] distances) {
        double cost = 0.0;
        for (List<Integer> route : routes) {
            int prev = DEPOT_INDEX;
            for (int node : route) {
                cost += distances[prev][node];
                prev = node;
            }
            cost += distances[prev][DEPOT_INDEX];
        }
        return cost;
    }

    private int load(List<Integer> route, int[] demands) {
        int sum = 0;
        for (int node : route) {
            sum += demands[node];
        }
        return sum;
    }

    private List<List<Integer>> copy(List<List<Integer>> routes) {
        List<List<Integer>> copy = new ArrayList<>(routes.size());
        for (List<Integer> route : routes) {
            copy.add(new ArrayList<>(route));
        }
        return copy;
    }
}
