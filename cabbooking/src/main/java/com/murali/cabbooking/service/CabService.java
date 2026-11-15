package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.Cab;
import com.murali.cabbooking.entity.User;
import com.murali.cabbooking.repository.CabRepository;
import com.murali.cabbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CabService {

    private final CabRepository cabRepository;
    private final UserRepository userRepository;

    // 🚗 Add Cab (Driver Only)
    public Cab addCab(Cab cab, String driverEmail) {
        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        cab.setDriver(driver);
        cab.setAvailable(true);

        return cabRepository.save(cab);
    }

    // 📍 Get Available Cabs
    public List<Cab> getAvailableCabs() {
        return cabRepository.findByAvailableTrue();
    }

    // 🔄 Update Cab Location
    public Cab updateLocation(Long cabId, Double lat, Double lng) {
        Cab cab = cabRepository.findById(cabId)
                .orElseThrow(() -> new RuntimeException("Cab not found"));

        cab.setLatitude(lat);
        cab.setLongitude(lng);

        return cabRepository.save(cab);
    }
}