package com.murali.cabbooking.service;

import java.util.*;

final class RoadRoutePlanner {

    private RoadRoutePlanner() {
    }

    static Route findShortestRoute(List<Route> routes) {
        Map<String, Coordinate> coordinates = new HashMap<>();
        Map<String, List<Edge>> graph = new HashMap<>();
        List<Route> usableRoutes = routes.stream()
                .filter(route -> Double.isFinite(route.distanceKm())
                        && route.distanceKm() > 0
                        && route.coordinates().size() >= 2
                        && polylineLength(route.coordinates()) > 0)
                .toList();

        for (Route route : usableRoutes) {
            double geometricDistance = polylineLength(route.coordinates());
            double distanceScale = route.distanceKm() / geometricDistance;
            for (int index = 1; index < route.coordinates().size(); index++) {
                Coordinate from = route.coordinates().get(index - 1);
                Coordinate to = route.coordinates().get(index);
                String fromKey = key(from);
                String toKey = key(to);
                coordinates.put(fromKey, from);
                coordinates.put(toKey, to);
                double weight = distanceBetween(from, to) * distanceScale;
                graph.computeIfAbsent(fromKey, ignored -> new ArrayList<>())
                        .add(new Edge(toKey, weight));
            }
        }

        if (graph.isEmpty() || usableRoutes.isEmpty()) {
            throw new IllegalArgumentException("The routing service returned no usable road routes.");
        }

        Route initialRoute = usableRoutes.get(0);
        String start = key(initialRoute.coordinates().get(0));
        String destination = key(initialRoute.coordinates().get(initialRoute.coordinates().size() - 1));

        Map<String, Double> distances = new HashMap<>();
        Map<String, String> previous = new HashMap<>();
        PriorityQueue<QueueEntry> queue = new PriorityQueue<>(Comparator.comparingDouble(QueueEntry::distance));
        distances.put(start, 0.0);
        queue.add(new QueueEntry(start, 0));

        while (!queue.isEmpty()) {
            QueueEntry current = queue.poll();
            if (current.distance() > distances.getOrDefault(current.node(), Double.POSITIVE_INFINITY)) {
                continue;
            }
            if (current.node().equals(destination)) {
                break;
            }

            for (Edge edge : graph.getOrDefault(current.node(), List.of())) {
                double candidateDistance = current.distance() + edge.distance();
                if (candidateDistance < distances.getOrDefault(edge.destination(), Double.POSITIVE_INFINITY)) {
                    distances.put(edge.destination(), candidateDistance);
                    previous.put(edge.destination(), current.node());
                    queue.add(new QueueEntry(edge.destination(), candidateDistance));
                }
            }
        }

        Double shortestDistance = distances.get(destination);
        if (shortestDistance == null) {
            throw new IllegalArgumentException("No drivable route connects these locations.");
        }

        LinkedList<Coordinate> path = new LinkedList<>();
        String current = destination;
        while (current != null) {
            path.addFirst(coordinates.get(current));
            if (current.equals(start)) {
                break;
            }
            current = previous.get(current);
        }
        if (path.isEmpty() || !key(path.getFirst()).equals(start)) {
            throw new IllegalArgumentException("Could not reconstruct the shortest road route.");
        }

        return new Route(shortestDistance, List.copyOf(path));
    }

    private static String key(Coordinate coordinate) {
        return String.format(Locale.ROOT, "%.6f,%.6f", coordinate.latitude(), coordinate.longitude());
    }

    private static double distanceBetween(Coordinate first, Coordinate second) {
        double firstLatitude = Math.toRadians(first.latitude());
        double secondLatitude = Math.toRadians(second.latitude());
        double latitudeDistance = secondLatitude - firstLatitude;
        double longitudeDistance = Math.toRadians(second.longitude() - first.longitude());
        double haversine = Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2)
                + Math.cos(firstLatitude) * Math.cos(secondLatitude)
                * Math.sin(longitudeDistance / 2) * Math.sin(longitudeDistance / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    }

    private static double polylineLength(List<Coordinate> coordinates) {
        double length = 0;
        for (int index = 1; index < coordinates.size(); index++) {
            length += distanceBetween(coordinates.get(index - 1), coordinates.get(index));
        }
        return length;
    }

    record Coordinate(double latitude, double longitude) {
    }

    record Route(double distanceKm, List<Coordinate> coordinates) {
    }

    private record Edge(String destination, double distance) {
    }

    private record QueueEntry(String node, double distance) {
    }
}
