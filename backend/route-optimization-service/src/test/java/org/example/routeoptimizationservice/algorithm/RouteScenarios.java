package org.example.routeoptimizationservice.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Stałe scenariusze do porównywania algorytmów optymalizacji tras.
 *
 * Każdy scenariusz ma ustaloną liczbę paczek, flotę (liczba aut i pojemność) oraz seed,
 * więc przy każdym uruchomieniu generuje dokładnie te same dane: paczki i macierz kosztów.
 * Wszystkie algorytmy dostają w danym scenariuszu identyczne dane wejściowe.
 */
final class RouteScenarios {

    /** Magazyn – indeks 0 w macierzy kosztów. */
    static final Location DEPOT = new Location(0, 52.2297, 21.0122, 0);

    /**
     * @param name       nazwa scenariusza
     * @param packages   liczba paczek
     * @param vehicles   liczba dostępnych aut (każde robi jedną trasę)
     * @param capacity   pojemność każdego auta (w jednostkach ładunku: S = 1, M = 2, L = 4)
     * @param seed       ziarno generatora paczek – te same dane przy każdym uruchomieniu
     */
    record Scenario(String name, int packages, int vehicles, int capacity, long seed) {

        /** Paczki rozrzucone po obszarze ok. 7 x 6 km wokół magazynu, rozmiary S/M/L jak w serwisie. */
        List<Location> deliveries() {
            Random random = new Random(seed);
            int[] sizes = {1, 2, 4};
            List<Location> deliveries = new ArrayList<>(packages);
            for (int i = 0; i < packages; i++) {
                deliveries.add(new Location(i + 1,
                        52.20 + random.nextDouble() * 0.06,
                        20.97 + random.nextDouble() * 0.08,
                        sizes[random.nextInt(sizes.length)]));
            }
            return deliveries;
        }

        List<Integer> capacities() {
            return Collections.nCopies(vehicles, capacity);
        }

        double[][] costMatrix() {
            return buildMatrix(DEPOT, deliveries());
        }

    }

    /** Scenariusze od małych do dużych przejazdów; flota ma ok. 20% zapasu pojemności ponad ładunek. */
    static final List<Scenario> ALL = List.of(
            new Scenario("Mały kurs", 5, 1, 15, 101),
            new Scenario("Krótka trasa", 7, 1, 17, 107),
            new Scenario("Dwa auta", 8, 2, 10, 108),
            new Scenario("Osiedle", 10, 1, 25, 102),
            new Scenario("Osiedle, 2 auta", 10, 2, 14, 110),
            new Scenario("Dzielnica", 20, 2, 25, 103),
            new Scenario("Kilka dzielnic", 50, 3, 45, 104),
            new Scenario("Miasto", 100, 5, 50, 105),
            new Scenario("Duże miasto", 200, 10, 55, 106)
    );

    private RouteScenarios() {
    }

    /** Macierz odległości w metrach (haversine); indeks 0 to magazyn, 1..n to paczki. */
    static double[][] buildMatrix(Location depot, List<Location> deliveries) {
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
}
