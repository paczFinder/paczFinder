package com.delivery;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DeliveryServiceResourceTest {

    private static Long vehicleId;
    private static Long deliveryId;
    private static Long firstTripId;
    private static Long secondTripId;
    private static Long thirdTripId;

    @BeforeAll
    static void createVehicle() {
        String registrationNumber = "T-" + UUID.randomUUID().toString().substring(0, 8);

        // Create a vehicle with a unique registration number
        Number createdVehicleId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "brand": "Test",
                          "model": "Van",
                          "registrationNumber": "%s",
                          "capacity": 10
                        }
                        """.formatted(registrationNumber))
                .when()
                .post("/vehicles")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
        vehicleId = createdVehicleId.longValue();
    }

    @Test
    @Order(1)
    void createsAndEditsDelivery() {
        // Create a delivery
        Number createdDeliveryId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "recipientName": "Jan Kowalski",
                          "recipientPhone": "500600700",
                          "street": "Main Street",
                          "buildingNumber": "10",
                          "postalCode": "00-001",
                          "city": "Warsaw",
                          "country": "Poland",
                          "latitude": 52.2297,
                          "longitude": 21.0122,
                          "size": "S"
                        }
                        """)
                .when()
                .post("/deliveries")
                .then()
                .statusCode(201)
                .body("status", equalTo("ADDED"))
                .body("recipientName", equalTo("Jan Kowalski"))
                .extract()
                .path("id");
        deliveryId = createdDeliveryId.longValue();

        // Edit the delivery
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "recipientName": "Anna Nowak",
                          "recipientPhone": "500600700",
                          "street": "Updated Street",
                          "buildingNumber": "20",
                          "postalCode": "00-001",
                          "city": "Warsaw",
                          "country": "Poland",
                          "latitude": 52.2297,
                          "longitude": 21.0122,
                          "size": "S"
                        }
                        """)
                .when()
                .put("/deliveries/{id}", deliveryId)
                .then()
                .statusCode(200)
                .body("recipientName", equalTo("Anna Nowak"))
                .body("street", equalTo("Updated Street"))
                .body("buildingNumber", equalTo("20"))
                .body("status", equalTo("ADDED"));
    }

    @Test
    @Order(2)
    void createsTripAndAssignsDelivery() {
        // Create a trip
        firstTripId = createTrip();

        // Assign the delivery to the trip
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "deliveryId": %d
                        }
                        """.formatted(deliveryId))
                .when()
                .post("/trips/{id}/deliveries", firstTripId)
                .then()
                .statusCode(200)
                .body("id", equalTo(firstTripId.intValue()))
                .body("deliveryCount", equalTo(1))
                .body("usedCapacity", equalTo(1));

        // Verify that the delivery is now in delivery
        given()
                .when()
                .get("/trips/{id}/deliveries", firstTripId)
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].id", equalTo(deliveryId.intValue()))
                .body("[0].status", equalTo("IN_DELIVERY"));

        // Verify that the delivery status is updated
        given()
                .when()
                .get("/deliveries/{id}", deliveryId)
                .then()
                .statusCode(200)
                .body("status", equalTo("IN_DELIVERY"));
    }

    @Test
    @Order(3)
    void rejectsAssigningDeliveryAlreadyAssignedToAnotherTrip() {
        // Create a second trip
        secondTripId = createTrip();

        // Attempt to assign the same delivery to the second trip, which should fail
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "deliveryId": %d
                                }
                                """.formatted(deliveryId))
                        .when()
                        .post("/trips/{id}/deliveries", secondTripId),
                400,
                "not available"
        );
    }

    @Test
    @Order(4)
    void rejectsDeletingVehicleAssignedToTrip() {
        // Attempt to delete the vehicle that is assigned to a trip, which should fail
        errorResponse(
                given()
                        .when()
                        .delete("/vehicles/{id}", vehicleId),
                400,
                "Cannot delete a vehicle assigned to trips"
        );
    }

    @Test
    @Order(5)
    void deletingTripReleasesDeliveries() {
        // Delete the first trip
        given()
                .when()
                .delete("/trips/{id}", firstTripId)
                .then()
                .statusCode(204);

        // Verify that the delivery is now available again
        given()
                .when()
                .get("/deliveries/{id}", deliveryId)
                .then()
                .statusCode(200)
                .body("status", equalTo("ADDED"));
    }

    @Test
    @Order(6)
    void finishesTripAndRejectsEditingDeliveredDelivery() {
        // Assign the delivery to the second trip
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "deliveryId": %d
                        }
                        """.formatted(deliveryId))
                .when()
                .post("/trips/{id}/deliveries", secondTripId)
                .then()
                .statusCode(200)
                .body("deliveryCount", equalTo(1));

        // Finish the second trip
        given()
                .contentType(ContentType.JSON)
                .when()
                .post("/trips/{id}/finish", secondTripId)
                .then()
                .statusCode(200)
                .body("status", equalTo("FINISHED"));

        // Verify that the delivery is now delivered
        given()
                .when()
                .get("/deliveries/{id}", deliveryId)
                .then()
                .statusCode(200)
                .body("status", equalTo("DELIVERED"));

        // Attempt to update the delivered delivery, which should fail
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "recipientName": "Changed",
                                  "recipientPhone": "500600700",
                                  "street": "Forbidden Street",
                                  "buildingNumber": "99",
                                  "postalCode": "00-001",
                                  "city": "Warsaw",
                                  "country": "Poland",
                                  "latitude": 52.2297,
                                  "longitude": 21.0122,
                                  "size": "S"
                                }
                                """)
                        .when()
                        .put("/deliveries/{id}", deliveryId),
                400,
                "Cannot update a delivered delivery"
        );
    }

    @Test
    @Order(7)
    void rejectsModifyingFinishedTrip() {
        // Attempt to assign a delivery to the finished trip, which should fail
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "deliveryId": %d
                                }
                                """.formatted(deliveryId))
                        .when()
                        .post("/trips/{id}/deliveries", secondTripId),
                400,
                "Cannot modify a finished trip"
        );

        // Attempt to change the vehicle of the finished trip, which should also fail
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "vehicleId": %d
                                }
                                """.formatted(vehicleId))
                        .when()
                        .patch("/trips/{id}/vehicle", secondTripId),
                400,
                "Cannot modify a finished trip"
        );
    }

    @Test
    @Order(8)
    void deletesDeliveryAndReturnsNotFound() {
        // Delete the delivery
        given()
                .when()
                .delete("/deliveries/{id}", deliveryId)
                .then()
                .statusCode(204);

        // Verify that the delivery is no longer found
        given()
                .when()
                .get("/deliveries/{id}", deliveryId)
                .then()
                .statusCode(404)
                .body("message", containsString("Delivery not found"));
    }

    @Test
    @Order(9)
    void supportsBatchAssignmentAndRejectsDuplicateIds() {
        // Create first deliveries for batch assignment
        Number firstDelivery = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "recipientName": "Batch One",
                          "recipientPhone": "500600701",
                          "street": "Batch Street",
                          "buildingNumber": "1",
                          "postalCode": "00-001",
                          "city": "Warsaw",
                          "country": "Poland",
                          "latitude": 52.2297,
                          "longitude": 21.0122,
                          "size": "S"
                        }
                        """)
                .when()
                .post("/deliveries")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        // Create a second delivery for batch assignment
        Number secondDelivery = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "recipientName": "Batch Two",
                          "recipientPhone": "500600702",
                          "street": "Batch Street",
                          "buildingNumber": "2",
                          "postalCode": "00-001",
                          "city": "Warsaw",
                          "country": "Poland",
                          "latitude": 52.2297,
                          "longitude": 21.0122,
                          "size": "M"
                        }
                        """)
                .when()
                .post("/deliveries")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        // Create a third trip for batch assignment
        thirdTripId = createTrip();

        // Attempt to assign the same delivery ID twice in a batch, which should fail
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "deliveryIds": [%d, %d, %d]
                                }
                                """.formatted(firstDelivery, firstDelivery, secondDelivery))
                        .when()
                        .post("/trips/{id}/deliveries/batch", thirdTripId),
                400,
                "Duplicate delivery IDs are not allowed"
        );

        // Assign the two deliveries to the third trip in a batch
        given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "deliveryIds": [%d, %d]
                        }
                        """.formatted(firstDelivery, secondDelivery))
                .when()
                .post("/trips/{id}/deliveries/batch", thirdTripId)
                .then()
                .statusCode(200)
                .body("deliveryCount", equalTo(2))
                .body("usedCapacity", equalTo(3));
    }

    @Test
    @Order(10)
    void rejectsInvalidRequestsAndMissingResources() {
        // Attempt to create a delivery with an empty recipient name, which should fail
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "recipientName": "",
                                  "recipientPhone": "500600700",
                                  "street": "Street",
                                  "buildingNumber": "1",
                                  "postalCode": "00-001",
                                  "city": "Warsaw",
                                  "country": "Poland",
                                  "latitude": 52.2297,
                                  "longitude": 21.0122,
                                  "size": "S"
                                }
                                """)
                        .when()
                        .post("/deliveries"),
                400,
                "recipientName"
        );

        // Attempt to retrieve a non-existent delivery, which should return 404
        errorResponse(
                given()
                        .when()
                        .get("/deliveries/{id}", 999999L),
                404,
                "Delivery not found"
        );
        // Attempt to delete a non-existent delivery, which should return 404
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "vehicleId": 999999
                                }
                                """)
                        .when()
                        .post("/trips"),
                404,
                "Vehicle not found"
        );
    }

    private static Long createTrip() {
        // Create a trip with the existing vehicle
        Number createdTripId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "vehicleId": %d
                        }
                        """.formatted(vehicleId))
                .when()
                .post("/trips")
                .then()
                .statusCode(201)
                .body("status", equalTo("ADDED"))
                .extract()
                .path("id");

        Long id = createdTripId.longValue();
        assertNotNull(id);
        return id;
    }

    private static void errorResponse(Response response, int statusCode, String message) {
        response.then()
                .statusCode(statusCode)
                .body("message", containsString(message));
    }
}
