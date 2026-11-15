package com.murali.cabbooking.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RideFareTest {

    @Test
    void calculatesFareForEachVehicleCategory() {
        assertEquals(100, RoadRoutingService.fareFor("Mini", 4));
        assertEquals(120, RoadRoutingService.fareFor("Sedan", 4));
        assertEquals(140, RoadRoutingService.fareFor("SUV", 4));
        assertEquals(160, RoadRoutingService.fareFor("XL", 4));
    }

    @Test
    void rejectsUnsupportedVehicleCategory() {
        assertThrows(ResponseStatusException.class, () -> RoadRoutingService.fareFor("Van", 4));
    }

    @Test
    void normalizesVehicleTypeBeforeUsingItForAvailabilityMatching() {
        assertEquals("Mini", RoadRoutingService.canonicalVehicleType(" mini "));
    }
}
