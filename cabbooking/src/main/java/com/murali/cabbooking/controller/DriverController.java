
package com.murali.cabbooking.controller;

import com.murali.cabbooking.entity.Cab;
import com.murali.cabbooking.entity.Ride;
import com.murali.cabbooking.entity.Role;
import com.murali.cabbooking.entity.RideStatus;
import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.dto.CarRegistrationRequest;
import com.murali.cabbooking.dto.DriverProfileResponse;
import com.murali.cabbooking.dto.DriverProfileUpdateRequest;
import com.murali.cabbooking.repository.CabRepository;
import com.murali.cabbooking.repository.RideRepository;
import com.murali.cabbooking.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class DriverController {

    private final CabRepository cabRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;

    // Driver Dashboard
    @GetMapping("/dashboard")
    public String dashboard(Authentication authentication) {
        return "Welcome Driver " + authentication.getName();
    }

    @GetMapping("/my-cab")
    public Cab myCab(Authentication authentication) {
        User driver = getDriver(authentication);
        return cabRepository.findFirstByDriverOrderByIdAsc(driver).orElse(null);
    }

    @GetMapping("/my-profile")
    public DriverProfileResponse myProfile(Authentication authentication) {
        return toProfileResponse(getDriver(authentication));
    }

    @PutMapping("/my-profile")
    public DriverProfileResponse updateMyProfile(
            @Valid @RequestBody DriverProfileUpdateRequest request,
            Authentication authentication
    ) {
        User driver = getDriver(authentication);
        String licenseNumber = request.licenseNumber().trim().toUpperCase();

        if (!licenseNumber.equalsIgnoreCase(driver.getLicenseNumber())
                && userRepository.existsByLicenseNumberIgnoreCase(licenseNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This driving licence number is already in use."
            );
        }

        driver.setName(request.name().trim());
        driver.setPhone(request.phone().trim());
        driver.setLicenseNumber(licenseNumber);

        return toProfileResponse(userRepository.save(driver));
    }

    @PutMapping("/my-cab")
    public Cab updateMyCab(
            @Valid @RequestBody CarRegistrationRequest request,
            Authentication authentication
    ) {
        User driver = getDriver(authentication);

        Cab cab = cabRepository.findFirstByDriverOrderByIdAsc(driver)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Register a car before editing its details."
                ));

        String carNumber = request.carNumber().trim().toUpperCase();

        if (!carNumber.equalsIgnoreCase(cab.getCarNumber())
                && cabRepository.existsByCarNumberIgnoreCase(carNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This registration number is already in use."
            );
        }

        cab.setModel(request.model().trim());
        cab.setCarNumber(carNumber);
        cab.setVehicleType(request.vehicleType());

        return cabRepository.save(cab);
    }

    private DriverProfileResponse toProfileResponse(User driver) {
        return new DriverProfileResponse(
                driver.getName(),
                driver.getEmail(),
                driver.getPhone(),
                driver.getDriverId(),
                driver.getLicenseNumber()
        );
    }

    @PostMapping("/add-cab")
    public Cab addCab(
            @Valid @RequestBody CarRegistrationRequest request,
            Authentication authentication
    ) {
        User driver = getDriver(authentication);

        if (cabRepository.existsByDriver(driver)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A car is already registered to this driver."
            );
        }

        String carNumber = request.carNumber().trim().toUpperCase();

        if (cabRepository.existsByCarNumberIgnoreCase(carNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This registration number is already in use."
            );
        }

        Cab cab = Cab.builder()
                .model(request.model().trim())
                .carNumber(carNumber)
                .vehicleType(request.vehicleType())
                .available(true)
                .online(false)
                .build();

        cab.setDriver(driver);

        return cabRepository.save(cab);
    }

    private User getDriver(Authentication authentication) {
        User driver = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Driver account not found."
                ));

        if (driver.getRole() != Role.DRIVER) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only drivers can manage car details."
            );
        }

        return driver;
    }

    // View Driver Rides
    @GetMapping("/my-rides")
    public List<Ride> myRides(Authentication authentication) {
        return rideRepository.findByCab_Driver_EmailOrderByCreatedAtDesc(
                authentication.getName()
        );
    }

    // Accept Ride
    @PostMapping("/accept-ride/{rideId}")
    public Ride acceptRide(
            @PathVariable Long rideId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (ride.getStatus() != RideStatus.REQUESTED) {
            throw new RuntimeException("Ride already processed");
        }

        if (!ride.getCab().getDriver().getEmail().equals(email)) {
            throw new RuntimeException("You are not assigned to this ride");
        }

        ride.setStatus(RideStatus.ACCEPTED);

        return rideRepository.save(ride);
    }

    // Start Ride
    @PostMapping("/start-ride/{rideId}")
    public Ride startRide(
            @PathVariable Long rideId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getCab().getDriver().getEmail().equals(email)) {
            throw new RuntimeException("You are not assigned to this ride");
        }

        if (ride.getStatus() != RideStatus.ACCEPTED) {
            throw new RuntimeException("Only an accepted ride can be started");
        }

        ride.setStatus(RideStatus.STARTED);

        return rideRepository.save(ride);
    }

    // Complete Ride
    @PostMapping("/complete-ride/{rideId}")
    public Ride completeRide(
            @PathVariable Long rideId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getCab().getDriver().getEmail().equals(email)) {
            throw new RuntimeException("You are not assigned to this ride");
        }

        if (ride.getStatus() != RideStatus.STARTED) {
            throw new RuntimeException("Only a started ride can be completed");
        }

        ride.setStatus(RideStatus.COMPLETED);

        Cab cab = ride.getCab();
        cab.setAvailable(true);

        cabRepository.save(cab);

        return rideRepository.save(ride);
    }

    // Cancel Ride
    @PostMapping("/cancel-ride/{rideId}")
    public Ride cancelRideByDriver(
            @PathVariable Long rideId,
            Authentication authentication
    ) {
        String email = authentication.getName();

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getCab().getDriver().getEmail().equals(email)) {
            throw new RuntimeException("You are not assigned to this ride");
        }

        if (ride.getStatus() == RideStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed ride");
        }

        ride.setStatus(RideStatus.CANCELLED);

        Cab cab = ride.getCab();
        cab.setAvailable(true);

        cabRepository.save(cab);

        return rideRepository.save(ride);
    }

    // Update Driver Location
    @PutMapping("/update-location")
    public Cab updateLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            Authentication authentication
    ) {
        String email = authentication.getName();

        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        List<Cab> cabs = cabRepository.findByDriver(driver);

        if (cabs.isEmpty()) {
            throw new RuntimeException("Cab not found");
        }

        Cab cab = cabs.get(0);

        cab.setLatitude(latitude);
        cab.setLongitude(longitude);

        return cabRepository.save(cab);
    }

    // Driver Go Online
    @PutMapping("/go-online")
    public Cab goOnline(Authentication authentication) {
        String email = authentication.getName();

        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        List<Cab> cabs = cabRepository.findByDriver(driver);

        if (cabs.isEmpty()) {
            throw new RuntimeException("Cab not found");
        }

        Cab cab = cabs.get(0);
        cab.setOnline(true);

        return cabRepository.save(cab);
    }

    // Driver Go Offline
    @PutMapping("/go-offline")
    public Cab goOffline(Authentication authentication) {
        String email = authentication.getName();

        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        List<Cab> cabs = cabRepository.findByDriver(driver);

        if (cabs.isEmpty()) {
            throw new RuntimeException("Cab not found");
        }

        Cab cab = cabs.get(0);
        cab.setOnline(false);

        return cabRepository.save(cab);
    }

    // Get Available Driver for Ride
    @GetMapping("/available")
    public Cab getAvailableDriver() {
        List<Cab> cabs = cabRepository.findAll()
                .stream()
                .filter(cab -> cab.isAvailable() && cab.isOnline())
                .toList();

        if (cabs.isEmpty()) {
            throw new RuntimeException("No drivers available");
        }

        return cabs.get(0);
    }
}
