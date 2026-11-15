package com.murali.cabbooking.dto;

public record DriverProfileResponse(
        String name,
        String email,
        String phone,
        String driverId,
        String licenseNumber
) {
}
