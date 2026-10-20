package com.delivery.enums;

public enum DeliverySize {
    S(1),
    M(2),
    L(4);

    private final int loadUnits;

    DeliverySize(int loadUnits) {
        this.loadUnits = loadUnits;
    }

    public int getLoadUnits() {
        return loadUnits;
    }
}
