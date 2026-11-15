package com.murali.cabbooking.service;

import com.murali.cabbooking.entity.Billing;
import com.murali.cabbooking.entity.Ride;
import com.murali.cabbooking.repository.BillingRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BillingServiceTest {

    @Test
    void createsBillWithEighteenPercentGstAndAddressSnapshots() {
        BillingRepository repository = mock(BillingRepository.class);
        when(repository.save(any(Billing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        BillingService service = new BillingService(repository);

        Ride ride = Ride.builder()
                .fare(334.0)
                .pickupAddress("Office")
                .dropoffAddress("Home")
                .build();

        Billing billing = service.createForRide(ride);

        assertEquals(new BigDecimal("334.00"), billing.getFare());
        assertEquals(new BigDecimal("18.00"), billing.getGstPercentage());
        assertEquals(new BigDecimal("60.12"), billing.getGstAmount());
        assertEquals(new BigDecimal("394.12"), billing.getTotalAmount());
        assertEquals("Office", billing.getPickupAddress());
        assertEquals("Home", billing.getDestinationAddress());
        assertEquals(ride, billing.getRide());
    }
}
