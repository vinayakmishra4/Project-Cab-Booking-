package com.murali.cabbooking.dto;

import java.util.List;

public record RideEstimateResponse(
        double distanceKm,
        double fare,
        List<RouteCoordinate> routeCoordinates,
        List<RideFareOption> fareOptions
) {
    public record RouteCoordinate(double latitude, double longitude) {
    }
}
