package com.murali.cabbooking.controller;

import com.murali.cabbooking.entity.Ride;
import com.murali.cabbooking.dto.RideEstimateResponse;
import com.murali.cabbooking.repository.RideRepository;
import com.murali.cabbooking.service.RideService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserRideController {

    private final RideService rideService;
    private final RideRepository rideRepository;

    @GetMapping("/estimate-ride")
    public RideEstimateResponse estimateRide(
            @RequestParam Double pickupLat,
            @RequestParam Double pickupLng,
            @RequestParam Double dropLat,
            @RequestParam Double dropLng
    ) {
        return rideService.estimateRide(pickupLat, pickupLng, dropLat, dropLng);
    }

    // 🚕 Book Ride
    @PostMapping("/book-ride")
    public Ride bookRide(
            @RequestParam Double pickupLat,
            @RequestParam Double pickupLng,
            @RequestParam Double dropLat,
            @RequestParam Double dropLng,
            @RequestParam(required = false) String pickupAddress,
            @RequestParam(required = false) String dropoffAddress,
            Authentication authentication
    ) {

        String email = authentication.getName();

        return rideService.bookRide(
                pickupLat,
                pickupLng,
                dropLat,
                dropLng,
                pickupAddress,
                dropoffAddress,
                email
        );
    }

    // 📜 User Ride History
    @GetMapping("/my-rides")
    public List<Ride> getMyRides(Authentication authentication){
        return rideRepository.findAllByPassengerEmail(authentication.getName());
    }
}