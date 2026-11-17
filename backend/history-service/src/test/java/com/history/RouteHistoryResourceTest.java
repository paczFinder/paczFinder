package com.history;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RouteHistoryResourceTest {

    private static Long routeHistoryId;

    @Test
    @Order(1)
    void createsRouteHistory() {
        // Create a route history record with a complete stop list and verify it is stored correctly
        Number createdRouteHistoryId = given()
                .contentType(ContentType.JSON)
                .body("""
                        {
                          "sourceRoutePlanId": 1001,
                          "tripId": 5001,
                          "totalDistanceM": 1250,
                          "drivingTimeS": 600,
                          "serviceTimeS": 180,
                          "totalTimeS": 780,
                          "stops": [
                            {
                              "deliveryId": 11,
                              "stopOrder": 1,
                              "address": "Biuro, ul. Main 1",
                              "latitude": 52.2297,
                              "longitude": 21.0122
                            },
                            {
                              "deliveryId": 12,
                              "stopOrder": 2,
                              "address": "ul. Zielona 12",
                              "latitude": 52.2350,
                              "longitude": 21.0200
                            },
                            {
                              "deliveryId": 13,
                              "stopOrder": 3,
                              "address": "Biuro, ul. Main 1",
                              "latitude": 52.2297,
                              "longitude": 21.0122
                            }
                          ]
                        }
                        """)
                .when()
                .post("/history/routes")
                .then()
                .statusCode(201)
                .body("tripId", equalTo(5001))
                .body("sourceRoutePlanId", equalTo(1001))
                .body("stops", hasSize(3))
                .extract()
                .path("id");

        routeHistoryId = createdRouteHistoryId.longValue();
        assertNotNull(routeHistoryId);
    }

    @Test
    @Order(2)
    void getsRouteHistoryByIdAndPaginatedList() {
        // Verify the record can be retrieved by id and that the paginated list returns it
        given()
                .when()
                .get("/history/routes/{id}", routeHistoryId)
                .then()
                .statusCode(200)
                .body("id", equalTo(routeHistoryId.intValue()))
                .body("tripId", equalTo(5001))
                .body("stops", hasSize(3));

        given()
                .when()
                .get("/history/routes?page=0&size=20")
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("page", equalTo(0))
                .body("size", equalTo(20));
    }

    @Test
    @Order(3)
    void getsHistoryByTripIdAndLatest() {
        // Verify trip-based queries return all history for a trip and the newest item for that trip
        given()
                .when()
                .get("/history/trips/{tripId}", 5001)
                .then()
                .statusCode(200)
                .body("$", hasSize(1))
                .body("[0].tripId", equalTo(5001));

        given()
                .when()
                .get("/history/trips/{tripId}/latest", 5001)
                .then()
                .statusCode(200)
                .body("tripId", equalTo(5001))
                .body("id", equalTo(routeHistoryId.intValue()));
    }

    @Test
    @Order(4)
    void rejectsDuplicateSourceRoutePlanId() {
        // Attempt to create a second route history for the same source route plan and expect a validation error
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "sourceRoutePlanId": 1001,
                                  "tripId": 5002,
                                  "totalDistanceM": 1300,
                                  "drivingTimeS": 660,
                                  "serviceTimeS": 200,
                                  "totalTimeS": 860,
                                  "stops": [
                                    {
                                      "deliveryId": 21,
                                      "stopOrder": 1,
                                      "address": "Biuro, ul. Main 1",
                                      "latitude": 52.2297,
                                      "longitude": 21.0122
                                    }
                                  ]
                                }
                                """)
                        .when()
                        .post("/history/routes"),
                400,
                "already exists"
        );
    }

    @Test
    @Order(5)
    void rejectsInvalidRequest() {
        // Invalid payload must be rejected by validation before the record is persisted
        errorResponse(
                given()
                        .contentType(ContentType.JSON)
                        .body("""
                                {
                                  "sourceRoutePlanId": null,
                                  "tripId": null,
                                  "totalDistanceM": 100,
                                  "drivingTimeS": 50,
                                  "serviceTimeS": 10,
                                  "totalTimeS": 60,
                                  "stops": []
                                }
                                """)
                        .when()
                        .post("/history/routes"),
                400,
                "required"
        );
    }

    @Test
    @Order(6)
    void deletesRouteHistory() {
        // Delete the created record and verify that retrieving it afterwards returns 404
        given()
                .when()
                .delete("/history/routes/{id}", routeHistoryId)
                .then()
                .statusCode(204);

        given()
                .when()
                .get("/history/routes/{id}", routeHistoryId)
                .then()
                .statusCode(404)
                .body("message", containsString("Route history not found"));
    }

    private static void errorResponse(Response response, int statusCode, String message) {
        response.then()
                .statusCode(statusCode)
                .body("message", containsString(message));
    }
}
