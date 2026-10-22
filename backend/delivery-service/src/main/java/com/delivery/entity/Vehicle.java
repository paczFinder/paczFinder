package com.delivery.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "brand", nullable = false, length = 50)
    public String brand;

    @Column(name = "model", nullable = false, length = 50)
    public String model;

    @Column(name = "registration_number", nullable = false, unique = true, length = 10)
    public String registrationNumber;

    @Positive
    @Column(name = "capacity", nullable = false)
    public Integer capacity;

    @Column(name = "is_active", nullable = false)
    public boolean active = true;

    @Column(name = "courier_keycloak_id", length = 255)
    public String courierKeycloakId;
}
