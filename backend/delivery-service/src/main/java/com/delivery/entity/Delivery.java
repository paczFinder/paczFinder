package com.delivery.entity;

import com.delivery.enums.DeliverySize;
import com.delivery.enums.DeliveryStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

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

    @Column(name = "street", nullable = false, length = 100)
    public String street;

    @Column(name = "building_number", nullable = false, length = 10)
    public String buildingNumber;

    @Column(name = "apartment_number", length = 10)
    public String apartmentNumber;

    @Column(name = "postal_code", nullable = false, length = 10)
    public String postalCode;

    @Column(name = "city", nullable = false, length = 100)
    public String city;

    @Column(name = "country", nullable = false, length = 60)
    public String country;

    @Column(name = "latitude", nullable = false)
    public Double latitude;

    @Column(name = "longitude", nullable = false)
    public Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "size", nullable = false, length = 1, columnDefinition = "VARCHAR(1)")
    public DeliverySize size;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    public DeliveryStatus status = DeliveryStatus.ADDED;
}
