package org.example.routeoptimizationservice.algorithm;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Brute force – sprawdza wszystkie możliwości:
 *  1. każdą kolejność paczek (n! kolejności),
 *  2. dla każdej kolejności każdy podział na kolejne auta (auto 1 bierze pierwsze paczki, auto 2 następne itd.),
 *  3. pomija podziały, w których auto byłoby przeładowane,
 *  4. zapamiętuje rozwiązanie o najmniejszym koszcie.
 * Jeśli paczki nie mieszczą się w autach, zwraca puste rozwiązanie.
 * Czas rośnie jak n!, więc algorytm nadaje się tylko do małej liczby paczek.
 */
@Component
public class BruteForceOptimizer {

    private static final int DEPOT_INDEX = 0;

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

        if (n == 0) {
            return new Solution(List.of(), 0.0);
        }

        Search search = new Search(n, demands, capacities, distances);
        search.permute(new ArrayList<>(), new boolean[totalNodes]);

        if (search.bestRoutes == null) {
            return new Solution(List.of(), 0.0); // paczki nie mieszczą się w autach
        }
        return new Solution(search.bestRoutes, search.bestCost);
    }

    /** Przeszukiwanie dla jednego wywołania optimize */
    private static final class Search {

        private final int n;                 // liczba paczek
        private final int[] demands;         // zapotrzebowanie na ładunek dla każdego punktu
        private final int[] capacities;      // pojemności aut
        private final double[][] distances;  // macierz kosztów

        private List<List<Integer>> bestRoutes = null;  // najlepsze znalezione trasy
        private double bestCost = Double.MAX_VALUE;     // ich koszt

        Search(int n, int[] demands, int[] capacities, double[][] distances) {
            this.n = n;
            this.demands = demands;
            this.capacities = capacities;
            this.distances = distances;
        }

        /** Krok 1: generuje wszystkie kolejności paczek. */
        void permute(List<Integer> order, boolean[] used) {
            if (order.size() == n) {
                split(order, 0, 0, new ArrayList<>());
                return;
            }
            for (int node = 1; node <= n; node++) {
                if (!used[node]) {
                    used[node] = true;
                    order.add(node);
                    permute(order, used);
                    order.removeLast();
                    used[node] = false;
                }
            }
        }

        /**
         * Krok 2: dzieli kolejność na trasy kolejnych aut.
         * Auto {@code vehicle} bierze paczki od pozycji {@code start} do {@code end - 1} – sprawdzamy każde {@code end}.
         */
        private void split(List<Integer> order, int start, int vehicle, List<List<Integer>> routes) {
            if (start == n) {
                // Wszystkie paczki rozdzielone – krok 4: porównujemy z najlepszym
                double cost = totalCost(routes);
                if (cost < bestCost) {
                    bestCost = cost;
                    bestRoutes = new ArrayList<>(routes);
                }
                return;
            }
            if (vehicle == capacities.length) {
                return; // zostały paczki, a nie ma już aut
            }
            for (int end = start + 1; end <= n; end++) {
                List<Integer> route = new ArrayList<>(order.subList(start, end));
                if (load(route) > capacities[vehicle]) {
                    break; // krok 3: auto przeładowane (dłuższe fragmenty też się nie zmieszczą)
                }
                routes.add(route);
                split(order, end, vehicle + 1, routes);
                routes.removeLast();
            }
        }

        /** Łączny koszt tras: dla każdej magazyn -> paczki -> magazyn */
        private double totalCost(List<List<Integer>> routes) {
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

        private int load(List<Integer> route) {
            int sum = 0;
            for (int node : route) {
                sum += demands[node];
            }
            return sum;
        }
    }
}
