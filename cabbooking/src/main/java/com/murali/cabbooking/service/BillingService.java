package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.Billing;
import com.murali.cabbooking.entity.Ride;
import com.murali.cabbooking.repository.BillingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class BillingService {

    private static final BigDecimal GST_PERCENTAGE = new BigDecimal("18.00");
    private static final BigDecimal PERCENTAGE_BASE = new BigDecimal("100");

    private final BillingRepository billingRepository;

    public Billing createForRide(Ride ride) {
        BigDecimal fare = BigDecimal.valueOf(ride.getFare())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal gstAmount = fare.multiply(GST_PERCENTAGE)
                .divide(PERCENTAGE_BASE, 2, RoundingMode.HALF_UP);

        return billingRepository.save(Billing.builder()
                .ride(ride)
                .pickupAddress(addressOrCoordinates(
                        ride.getPickupAddress(), ride.getPickupLat(), ride.getPickupLng()))
                .destinationAddress(addressOrCoordinates(
                        ride.getDropoffAddress(), ride.getDropLat(), ride.getDropLng()))
                .fare(fare)
                .gstPercentage(GST_PERCENTAGE)
                .gstAmount(gstAmount)
                .totalAmount(fare.add(gstAmount))
                .build());
    }

    private String addressOrCoordinates(String address, Double latitude, Double longitude) {
        if (address != null && !address.isBlank()) return address;
        return String.format("%.5f, %.5f", latitude, longitude);
    }
}
