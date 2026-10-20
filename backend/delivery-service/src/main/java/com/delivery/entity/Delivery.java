package com.delivery.entity;

import jakarta.persistence.*;
import com.delivery.enums.DeliverySize;
import com.delivery.enums.DeliveryStatus;

@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "recipient_name", nullable = false, length = 100)
    public String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    public String recipientPhone;

    @Column(nullable = false, length = 100)
    public String street;

    @Column(name = "building_number", nullable = false, length = 10)
    public String buildingNumber;

    @Column(name = "apartment_number", length = 10)
    public String apartmentNumber;

    @Column(name = "postal_code", nullable = false, length = 10)
    public String postalCode;

    @Column(nullable = false, length = 100)
    public String city;

    @Column(nullable = false, length = 60)
    public String country;

    @Column(nullable = false)
    public Double latitude;

    @Column(nullable = false)
    public Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 1, columnDefinition = "VARCHAR(1)")
    public DeliverySize size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public DeliveryStatus status = DeliveryStatus.ADDED;
}
