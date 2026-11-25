package org.example.routeoptimizationservice.algorithm;

import java.util.Arrays;

public final class PheromoneTable {

    private final double[][] pheromones;

    public PheromoneTable(int size, double initialPheromone) {
        pheromones = new double[size][size];
        for (double[] row : pheromones) {
            Arrays.fill(row, initialPheromone);
        }
    }

    public double get(int i, int j) {
        return pheromones[i][j];
    }

    public void set(int i, int j, double value) {
        pheromones[i][j] = value;
    }

    public void evaporate(double rate) {
        for (double[] row : pheromones) {
            for (int j = 0; j < row.length; j++) {
                row[j] *= (1.0 - rate);
            }
        }
    }

    public void deposit(int i, int j, double amount) {
        pheromones[i][j] += amount;
    }

    public int size() {
        return pheromones.length;
    }
}
