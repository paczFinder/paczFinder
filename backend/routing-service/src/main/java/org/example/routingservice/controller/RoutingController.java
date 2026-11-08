package org.example.routingservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.routingservice.dto.MatrixRequest;
import org.example.routingservice.dto.MatrixResponse;
import org.example.routingservice.dto.RouteRequest;
import org.example.routingservice.dto.RouteResponse;
import org.example.routingservice.service.RoutingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/routing")
@Tag(name = "Routing Service", description = "Fasada nad silnikiem OSRM. Dostarcza macierzy kosztów oraz geometrii trasy dla Route Optimizer.")
public class RoutingController {

    private final RoutingService routingService;

    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }

    @Operation(
        summary = "Pobranie macierzy kosztów (durations i distances)",
        description = "Wywoływany przez Route Optimizer przed optymalizacją. Przyjmuje listę punktów (magazyn + dostawy) i zwraca macierz N×N z czasami (sekundy) i odległościami (metry) między każdą parą punktów. Współrzędne wejściowe w formacie lat,lon; konwersja na lon,lat dla OSRM dzieje się wewnątrz serwisu."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Macierz kosztów zwrócona pomyślnie",
            content = @Content(schema = @Schema(implementation = MatrixResponse.class))),
        @ApiResponse(responseCode = "400", description = "Nieprawidłowe dane wejściowe (np. mniej niż 2 punkty)"),
        @ApiResponse(responseCode = "502", description = "OSRM niedostępny — użyto fallbacku Haversine'a")
    })
    @PostMapping("/matrix")
    public ResponseEntity<MatrixResponse> matrix(
        @Parameter(description = "Lista punktów: magazyn + punkty dostaw (id, szerokość i długość geograficzna)", required = true)
        @RequestBody MatrixRequest request) {
        return ResponseEntity.ok(routingService.matrix(request));
    }

    @Operation(
        summary = "Pobranie geometrii trasy",
        description = "Wywoływany po zakończeniu optymalizacji. Przyjmuje punkty w już wyznaczonej kolejności i zwraca geometrię trasy (GeoJSON LineString) oraz podsumowanie: łączny dystans i czas."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Geometria trasy zwrócona pomyślnie",
            content = @Content(schema = @Schema(implementation = RouteResponse.class))),
        @ApiResponse(responseCode = "400", description = "Nieprawidłowe dane wejściowe (np. mniej niż 2 punkty)"),
        @ApiResponse(responseCode = "502", description = "OSRM niedostępny — użyto fallbacku Haversine'a")
    })
    @PostMapping("/route")
    public ResponseEntity<RouteResponse> route(
        @Parameter(description = "Lista punktów w już zoptymalizowanej kolejności (magazyn jako pierwszy i ostatni)", required = true)
        @RequestBody RouteRequest request) {
        return ResponseEntity.ok(routingService.route(request));
    }
}
