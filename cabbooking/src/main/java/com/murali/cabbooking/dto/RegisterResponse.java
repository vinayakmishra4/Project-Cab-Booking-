package com.murali.cabbooking.dto;

public record RegisterResponse(
        String message,
        String role,
        String employeeId,
        String driverId
) {
}
