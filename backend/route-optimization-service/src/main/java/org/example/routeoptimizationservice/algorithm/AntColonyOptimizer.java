package org.example.routeoptimizationservice.algorithm;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

import org.springframework.stereotype.Component;

@Component
public class AntColonyOptimizer {

    private static final int DEPOT_INDEX = 0;
    private static final int ITERATIONS = 100;   // liczba iteracji algorytmu
    private static final int ANTS = 20;          // liczba mrówek na iterację
    private static final double ALPHA = 1.0;     // wagа feromonu w wyborze trasy
    private static final double BETA = 2.0;      // wagа heurystyki (dystans) w wyborze trasy
    private static final double EVAPORATION_RATE = 0.1; // szybkość parowania feromonu
    private static final double INITIAL_PHEROMONE = 1.0; // początkowa wartość feromonu

    private final Random random;

    public AntColonyOptimizer() {
        this.random = new Random();
    }

    public AntColonyOptimizer(long seed) {
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

        // Współdzielona tablica feromonów dla wszystkich mrówek
        PheromoneTable pheromones = new PheromoneTable(totalNodes, INITIAL_PHEROMONE);

        Solution best = null;

        // Główna pętla iteracji ACO
        for (int iteration = 0; iteration < ITERATIONS; iteration++) {
            List<Solution> solutions = new ArrayList<>(ANTS);

            // Każda mrówka buduje własne rozwiązanie niezależnie
            for (int a = 0; a < ANTS; a++) {
                Ant ant = new Ant(random, ALPHA, BETA, DEPOT_INDEX, pheromones, demands, capacities, distances);
                Solution solution = ant.construct();
                solutions.add(solution);

                // Zapamiętujemy najlepsze rozwiązanie dotychczas
                if (best == null || solution.totalCost() < best.totalCost()) {
                    best = solution;
                }
            }

            // Parowanie feromonu – stare ślady słabną
            pheromones.evaporate(EVAPORATION_RATE);

            // Najlepsze rozwiązanie zostawia nowy feromon na swoich krawędziach
            if (best != null) {
                double deposit = 1.0 / best.totalCost();
                for (List<Integer> route : best.routes()) {
                    int prev = DEPOT_INDEX;
                    for (int node : route) {
                        pheromones.deposit(prev, node, deposit);
                        pheromones.deposit(node, prev, deposit);
                        prev = node;
                    }
                    // Powrót do magazynu na końcu trasy
                    pheromones.deposit(prev, DEPOT_INDEX, deposit);
                    pheromones.deposit(DEPOT_INDEX, prev, deposit);
                }
            }
        }

        return best != null ? best : new Solution(List.of(), 0.0);
    }
}
