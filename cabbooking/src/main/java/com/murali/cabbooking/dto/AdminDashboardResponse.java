package com.murali.cabbooking.dto;

import java.util.List;

public record AdminDashboardResponse(
        long totalBookings,
        long completedTrips,
        long tripsInProgress,
        long pendingRides,
        long totalEmployees,
        long totalDrivers,
        long totalAdmins,
        long totalVehicles,
        long availableVehicles,
        long onlineVehicles,
        List<DailyBookingCount> bookingTrend,
        List<AdminRideSummary> recentBookings
) {
    public record DailyBookingCount(String date, long count) {}

    public record AdminRideSummary(
            Long id,
            String employeeName,
            String employeeId,
            String driverName,
            String driverId,
            String vehicleModel,
            String vehicleRegistration,
            String pickupAddress,
            String dropoffAddress,
            String status,
            String createdAt,
            Double fare
    ) {}
}
