package org.example.routeoptimizationservice.algorithm;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

public class Ant {

    private final Random random;
    private final double alpha; // wagа feromonu w wyborze następnego punktu
    private final double beta;  // wagа heurystyki (1/dystans) w wyborze następnego punktu
    private final int depotIndex; // indeks magazynu
    private final PheromoneTable pheromones; // współdzielona tablica feromonów
    private final int[] demands; // zapotrzebowanie na ładunek dla każdego punktu (depot = 0)
    private final int[] capacities; // pojemności pojazdów
    private final double[][] distances; // macierz kosztów (czas/dystans) między punktami

    private final List<List<Integer>> routes; // ukończone trasy tej mrówki
    private final int[] remainingCapacity; // pozostała pojemność bieżącego pojazdu
    private final List<Integer> currentRoute; // trasa w trakcie budowy (indeksy punktów)
    private final boolean[] visited; // czy punkt został już odwiedzony
    private int currentVehicle; // indeks bieżącego pojazdu (-1 na start)
    private double totalCost; // łączny koszt tras tej mrówki

    public Ant(Random random, double alpha, double beta, int depotIndex,
               PheromoneTable pheromones, int[] demands, int[] capacities, double[][] distances) {
        this.random = random;
        this.alpha = alpha;
        this.beta = beta;
        this.depotIndex = depotIndex;
        this.pheromones = pheromones;
        this.demands = demands;
        this.capacities = capacities;
        this.distances = distances;
        this.routes = new ArrayList<>();
        this.remainingCapacity = capacities.clone();
        this.currentRoute = new ArrayList<>();
        this.visited = new boolean[demands.length];
        this.currentVehicle = -1;
        this.totalCost = 0.0;
    }

    public Solution construct() {
        startRoute();

        while (hasUnvisited()) {
            int current = currentRoute.isEmpty() ? depotIndex : currentRoute.getLast();
            int next = selectNext(current);

            if (next == -1) {
                closeRoute();
                if (currentVehicle >= capacities.length) {
                    break;
                }
                startRoute();
                continue;
            }

            moveTo(next);
        }

        closeRoute();
        return new Solution(new ArrayList<>(routes), totalCost);
    }

    private boolean hasUnvisited() {
        return IntStream.range(0, visited.length)
                .anyMatch(i -> !visited[i] && demands[i] > 0);
    }

    /**
     * Wybiera następny punkt dostawy dla bieżącej pozycji mrówki.
     *
     * Prawdopodobieństwo wyboru punktu i jest proporcjonalne do:
     *   (feromon[current][i])^alpha * (1/dystans[current][i])^beta
     * Pomijane są punkty już odwiedzone, magazyn oraz punkty, których ładunek
     * przekracza pozostałą pojemność bieżącego pojazdu.
     * Zwraca -1 gdy brak kandydatów (trzeba zamknąć trasę).
     */
    private int selectNext(int current) {
        if (currentVehicle >= capacities.length) {
            return -1;
        }
        List<Integer> candidates = new ArrayList<>();
        List<Double> weights = new ArrayList<>();

        for (int i = 0; i < demands.length; i++) {
            if (i == depotIndex || visited[i] || demands[i] == 0) {
                continue;
            }
            if (demands[i] > remainingCapacity[currentVehicle]) {
                continue;
            }

            double pheromone = Math.max(pheromones.get(current, i), 1e-6);
            double heuristic = 1.0 / (distances[current][i] + 1e-6);
            double weight = Math.pow(pheromone, alpha) * Math.pow(heuristic, beta);

            candidates.add(i);
            weights.add(weight);
        }

        if (candidates.isEmpty()) {
            return -1;
        }

        double total = weights.stream().mapToDouble(Double::doubleValue).sum();
        double r = random.nextDouble() * total;
        double cumulative = 0.0;

        for (int i = 0; i < candidates.size(); i++) {
            cumulative += weights.get(i);
            if (r <= cumulative) {
                return candidates.get(i);
            }
        }

        return candidates.getLast();
    }

    private void moveTo(int node) {
        int current = currentRoute.isEmpty() ? depotIndex : currentRoute.getLast();
        totalCost += distances[current][node];
        currentRoute.add(node);
        visited[node] = true;
        remainingCapacity[currentVehicle] -= demands[node];
    }

    private void startRoute() {
        closeRoute();
        currentRoute.clear();
        currentVehicle++;
        if (currentVehicle < capacities.length) {
            remainingCapacity[currentVehicle] = capacities[currentVehicle];
        }
    }

    private void closeRoute() {
        if (currentRoute.isEmpty()) {
            return;
        }
        int last = currentRoute.getLast();
        totalCost += distances[last][depotIndex];
        routes.add(new ArrayList<>(currentRoute));
        currentRoute.clear();
    }
}
