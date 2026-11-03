package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.*;
import com.murali.cabbooking.repository.*;
import com.murali.cabbooking.dto.RideEstimateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final CabRepository cabRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoadRoutingService roadRoutingService;
    private final BillingService billingService;

    /* ==========================
       DISTANCE CALCULATION
    ========================== */

    private double calculateStraightLineDistance(double lat1, double lon1,
                                                 double lat2, double lon2) {

        final int R = 6371;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2)
                * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    public RideEstimateResponse estimateRide(Double pickupLat,
                                             Double pickupLng,
                                             Double dropLat,
                                             Double dropLng) {
        return roadRoutingService.estimate(pickupLat, pickupLng, dropLat, dropLng);
    }

    /* ==========================
       BOOK RIDE
    ========================== */

    @Transactional
    public Ride bookRide(Double pickupLat,
                         Double pickupLng,
                         Double dropLat,
                         Double dropLng,
                         String pickupAddress,
                         String dropoffAddress,
                         String userEmail) {

        Employee employee = employeeRepository.findByEmail(userEmail).orElse(null);
        User user = employee == null
                ? userRepository.findByEmail(userEmail)
                    .filter(existingUser -> existingUser.getRole() == Role.USER)
                    .orElseThrow(() -> new RuntimeException("User not found"))
                : null;

        List<Cab> availableCabs = cabRepository.findByAvailableTrueAndOnlineTrue();

        if (availableCabs.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No drivers are currently on duty. Please try again shortly.");
        }

        /* FIND NEAREST DRIVER */

        Cab nearestCab = availableCabs.stream()
                .filter(cab -> cab.getLatitude() != null && cab.getLongitude() != null)
                .min(Comparator.comparing(cab ->
                        calculateStraightLineDistance(
                                pickupLat,
                                pickupLng,
                                cab.getLatitude(),
                                cab.getLongitude()
                        )
                ))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "No drivers with a recent location are available right now."
                ));

        RideEstimateResponse estimate = estimateRide(
                pickupLat,
                pickupLng,
                dropLat,
                dropLng
        );

        /* DRIVER BUSY */

        nearestCab.setAvailable(false);
        cabRepository.save(nearestCab);

        Ride ride = Ride.builder()
                .pickupLat(pickupLat)
                .pickupLng(pickupLng)
                .dropLat(dropLat)
                .dropLng(dropLng)
                .pickupAddress(normalizeAddress(pickupAddress))
                .dropoffAddress(normalizeAddress(dropoffAddress))
                .distanceKm(estimate.distanceKm())
                .fare(estimate.fare())
                .status(RideStatus.REQUESTED)
                .user(user)
                .employee(employee)
                .cab(nearestCab)
                .build();

        Ride savedRide = rideRepository.save(ride);
        savedRide.setBilling(billingService.createForRide(savedRide));
        return savedRide;
    }

    private String normalizeAddress(String address) {
        if (address == null || address.isBlank()) {
            return null;
        }
        return address.trim();
    }

}