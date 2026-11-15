import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pickupIcon = L.divIcon({
    className: "gocab-map-marker pickup-map-marker",
    html: "<span>P</span>",
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const dropIcon = L.divIcon({
    className: "gocab-map-marker drop-map-marker",
    html: "<span>D</span>",
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const vehicleIcon = L.divIcon({
    className: "gocab-map-marker vehicle-map-marker",
    html: "<span aria-hidden=\"true\">↗</span>",
    iconSize: [34, 34],
    iconAnchor: [17, 17]
});

function MapClickHandler({ setPickup, setDrop, pickup, drop }) {
    useMapEvents({
        click(event) {
            const location = {
                lat: event.latlng.lat,
                lng: event.latlng.lng
            };

            if (!pickup) {
                setPickup(location);
            } else if (!drop) {
                setDrop(location);
            }
        }
    });

    return null;
}

function MapViewportUpdater({ pickup, drop, vehicle }) {
    const map = useMap();

    useEffect(() => {
        const locations = [pickup, drop, vehicle]
            .filter(Boolean)
            .map(({ lat, lng }) => [lat, lng]);

        if (locations.length > 1) {
            map.fitBounds(
                locations,
                { padding: [40, 40] }
            );
        } else if (locations.length === 1) {
            const [latitude, longitude] = locations[0];
            const location = { lat: latitude, lng: longitude };
            map.setView([location.lat, location.lng], 14);
        }
    }, [map, pickup, drop, vehicle]);

    return null;
}

function MapComponent({
    pickup,
    drop,
    setPickup,
    setDrop,
    vehicle,
    routeCoordinates,
    interactive = true
}) {
    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            className="free-map-canvas"
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportUpdater pickup={pickup} drop={drop} vehicle={vehicle} />
            {interactive && (
                <MapClickHandler
                    pickup={pickup}
                    drop={drop}
                    setPickup={setPickup}
                    setDrop={setDrop}
                />
            )}
            {pickup && <Marker position={pickup} icon={pickupIcon} title="Pickup" />}
            {drop && <Marker position={drop} icon={dropIcon} title="Destination" />}
            {vehicle && <Marker position={vehicle} icon={vehicleIcon} title="Driver location" />}
            {pickup && drop && (
                <Polyline
                    positions={routeCoordinates?.length > 1
                        ? routeCoordinates.map(({ latitude, longitude }) => [latitude, longitude])
                        : [[pickup.lat, pickup.lng], [drop.lat, drop.lng]]}
                    pathOptions={{ color: "#c8102e", weight: 4 }}
                />
            )}
        </MapContainer>
    );
}

export default MapComponent;
