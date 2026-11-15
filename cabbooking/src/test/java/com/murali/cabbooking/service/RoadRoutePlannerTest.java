package com.murali.cabbooking.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RoadRoutePlannerTest {

    @Test
    void selectsShortestConnectedRouteFromRoadAlternatives() {
        var start = new RoadRoutePlanner.Coordinate(12.0, 77.0);
        var longMiddle = new RoadRoutePlanner.Coordinate(12.0, 77.1);
        var shortMiddle = new RoadRoutePlanner.Coordinate(12.1, 77.0);
        var destination = new RoadRoutePlanner.Coordinate(12.0, 77.2);

        var shortest = RoadRoutePlanner.findShortestRoute(List.of(
                new RoadRoutePlanner.Route(20, List.of(start, longMiddle, destination)),
                new RoadRoutePlanner.Route(8, List.of(start, shortMiddle, destination))
        ));

        assertEquals(8, shortest.distanceKm(), 0.001);
        assertEquals(List.of(start, shortMiddle, destination), shortest.coordinates());
    }

    @Test
    void rejectsRoutesWithoutUsableRoadSegments() {
        assertThrows(
                IllegalArgumentException.class,
                () -> RoadRoutePlanner.findShortestRoute(List.of(
                        new RoadRoutePlanner.Route(0, List.of(
                                new RoadRoutePlanner.Coordinate(12.0, 77.0)
                        ))
                ))
        );
    }

    @Test
    void findsShortestPathAcrossConnectedRoadAlternatives() {
        var start = new RoadRoutePlanner.Coordinate(12.0, 77.0);
        var firstJunction = new RoadRoutePlanner.Coordinate(12.0, 77.1);
        var secondJunction = new RoadRoutePlanner.Coordinate(12.1, 77.1);
        var destination = new RoadRoutePlanner.Coordinate(12.1, 77.2);

        var shortest = RoadRoutePlanner.findShortestRoute(List.of(
                new RoadRoutePlanner.Route(20, List.of(start, secondJunction, destination)),
                new RoadRoutePlanner.Route(3, List.of(start, firstJunction, secondJunction)),
                new RoadRoutePlanner.Route(3, List.of(secondJunction, destination))
        ));

        assertEquals(6, shortest.distanceKm(), 0.001);
        assertEquals(List.of(start, firstJunction, secondJunction, destination), shortest.coordinates());
    }
}
