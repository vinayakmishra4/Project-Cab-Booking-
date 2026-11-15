package com.murali.cabbooking.dto;

public record RideFareOption(
        String vehicleType,
        double ratePerKm,
        double fare
) {
}
