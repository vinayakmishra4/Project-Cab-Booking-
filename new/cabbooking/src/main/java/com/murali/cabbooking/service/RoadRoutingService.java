package com.murali.cabbooking.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.murali.cabbooking.dto.RideFareOption;
import com.murali.cabbooking.dto.RideEstimateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoadRoutingService {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private static final Map<String, Double> FARE_PER_KILOMETER = new LinkedHashMap<>();

    static {
        FARE_PER_KILOMETER.put("Mini", 25.0);
        FARE_PER_KILOMETER.put("Sedan", 30.0);
        FARE_PER_KILOMETER.put("SUV", 35.0);
        FARE_PER_KILOMETER.put("XL", 40.0);
    }

    private final ObjectMapper objectMapper;

    public RideEstimateResponse estimate(double pickupLat, double pickupLng, double dropLat, double dropLng) {
        validateCoordinates(pickupLat, pickupLng, dropLat, dropLng);
        if (pickupLat == dropLat && pickupLng == dropLng) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup and destination must be different.");
        }

        String coordinates = String.format(
                Locale.ROOT,
                "%.6f,%.6f;%.6f,%.6f",
                pickupLng, pickupLat, dropLng, dropLat
        );
        URI uri = URI.create(
                "https://router.project-osrm.org/route/v1/driving/" + coordinates
                        + "?alternatives=3&overview=full&geometries=geojson&steps=false"
        );
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(12))
                .header("User-Agent", "GoCab-RideBooking/1.0")
                .GET()
                .build();

        try {
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "The road routing service is temporarily unavailable. Please try again."
                );
            }

            JsonNode routes = objectMapper.readTree(response.body()).path("routes");
            List<RoadRoutePlanner.Route> candidates = new ArrayList<>();
            for (JsonNode route : routes) {
                double distanceKm = route.path("distance").asDouble(Double.NaN) / 1000;
                JsonNode routeCoordinates = route.path("geometry").path("coordinates");
                List<RoadRoutePlanner.Coordinate> points = new ArrayList<>();
                for (JsonNode point : routeCoordinates) {
                    if (point.size() < 2 || !point.get(0).isNumber() || !point.get(1).isNumber()) {
                        continue;
                    }
                    points.add(new RoadRoutePlanner.Coordinate(
                            point.get(1).asDouble(),
                            point.get(0).asDouble()
                    ));
                }
                candidates.add(new RoadRoutePlanner.Route(distanceKm, points));
            }

            RoadRoutePlanner.Route shortest = RoadRoutePlanner.findShortestRoute(candidates);
            List<RideEstimateResponse.RouteCoordinate> routeCoordinates = shortest.coordinates().stream()
                    .map(point -> new RideEstimateResponse.RouteCoordinate(point.latitude(), point.longitude()))
                    .toList();
            List<RideFareOption> fareOptions = FARE_PER_KILOMETER.entrySet().stream()
                    .map(entry -> new RideFareOption(
                            entry.getKey(),
                            entry.getValue(),
                            calculateFare(shortest.distanceKm(), entry.getValue())
                    ))
                    .toList();
            return new RideEstimateResponse(shortest.distanceKm(), fareOptions.get(0).fare(), routeCoordinates, fareOptions);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Road routing was interrupted. Please try again.",
                    exception
            );
        } catch (IOException | IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not calculate a drivable route. Please try again.",
                    exception
            );
        }

    }

    public static double fareFor(String vehicleType, double distanceKm) {
        return calculateFare(distanceKm, ratePerKilometerFor(vehicleType));
    }

    public static double ratePerKilometerFor(String vehicleType) {
        return FARE_PER_KILOMETER.get(canonicalVehicleType(vehicleType));
    }

    public static String canonicalVehicleType(String vehicleType) {
        if (vehicleType != null) {
            for (Map.Entry<String, Double> entry : FARE_PER_KILOMETER.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(vehicleType.trim())) return entry.getKey();
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid car type.");
    }

    private static double calculateFare(double distanceKm, double ratePerKilometer) {
        return Math.round(distanceKm * ratePerKilometer);
    }

    private void validateCoordinates(double pickupLat, double pickupLng, double dropLat, double dropLng) {
        if (!isValidCoordinate(pickupLat, pickupLng) || !isValidCoordinate(dropLat, dropLng)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup and destination coordinates are invalid.");
        }
    }

    private boolean isValidCoordinate(double latitude, double longitude) {
        return Double.isFinite(latitude) && Double.isFinite(longitude)
                && latitude >= -90 && latitude <= 90
                && longitude >= -180 && longitude <= 180;
    }
}
