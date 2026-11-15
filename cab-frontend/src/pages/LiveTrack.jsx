
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import Navbar from "../components/Navbar";
import { estimateRide, getRideHistory } from "../services/rideService";

const activeStatuses = ["REQUESTED", "ACCEPTED", "STARTED"];

const tripSteps = [
    { status: "REQUESTED", title: "Ride confirmed", detail: "Your booking is in the system." },
    { status: "ACCEPTED", title: "Driver assigned", detail: "Your driver has accepted the trip." },
    { status: "STARTED", title: "On the way", detail: "Your trip is in progress." },
    { status: "COMPLETED", title: "Arrived", detail: "You have reached your destination." }
];

const isCoordinate = (value) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value));

function getPoint(latitude, longitude) {
    if (!isCoordinate(latitude) || !isCoordinate(longitude)) {
        return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return null;
    }

    return { lat, lng };
}

function distanceBetween(first, second) {
    const radians = (degrees) => degrees * Math.PI / 180;

    const latitudeDistance = radians(second.lat - first.lat);
    const longitudeDistance = radians(second.lng - first.lng);

    const haversine =
        Math.sin(latitudeDistance / 2) ** 2 +
        Math.cos(radians(first.lat)) *
        Math.cos(radians(second.lat)) *
        Math.sin(longitudeDistance / 2) ** 2;

    return 6371 * 2 * Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine)
    );
}

function formatEstimatedTime(minutes) {
    if (minutes < 60) {
        return `~${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes
        ? `~${hours} hr ${remainingMinutes} min`
        : `~${hours} hr`;
}

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
        return "Pending";
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "Pending";
    }

    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function LiveTrack() {
    const [searchParams] = useSearchParams();

    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [routeCoordinates, setRouteCoordinates] = useState(null);
    const [routeError, setRouteError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const navigate = useNavigate();
    const requestedRideId = searchParams.get("rideId");

    // Load ride details every 15 seconds.
    useEffect(() => {
        let mounted = true;

        const loadRides = async () => {
            try {
                const response = await getRideHistory();

                if (!Array.isArray(response.data)) {
                    throw new Error("The server returned an invalid ride list.");
                }

                if (mounted) {
                    setRides(response.data);
                    setError("");
                    setLastUpdated(new Date());
                }
            } catch (requestError) {
                if (mounted) {
                    setError(
                        requestError.response?.data?.message ||
                        requestError.message ||
                        "Could not load ride details. Please refresh the page."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadRides();

        const intervalId = window.setInterval(loadRides, 15000);

        return () => {
            mounted = false;
            window.clearInterval(intervalId);
        };
    }, []);

    // Select the requested ride.
    const ride = useMemo(() => {
        if (requestedRideId) {
            return rides.find(
                (item) => String(item.id) === requestedRideId
            ) || null;
        }

        return (
            rides.find((item) => activeStatuses.includes(item.status)) ||
            [...rides].sort(
                (first, second) => Number(second.id) - Number(first.id)
            )[0] ||
            null
        );
    }, [rides, requestedRideId]);

    const ridePickupLat = ride?.pickupLat;
    const ridePickupLng = ride?.pickupLng;
    const rideDropLat = ride?.dropLat;
    const rideDropLng = ride?.dropLng;

    // Load road route from backend.
    useEffect(() => {
        let mounted = true;

        if (
            ridePickupLat == null ||
            ridePickupLng == null ||
            rideDropLat == null ||
            rideDropLng == null
        ) {
            setRouteCoordinates(null);
            setRouteError("");
            return undefined;
        }

        estimateRide({
            pickupLat: Number(ridePickupLat),
            pickupLng: Number(ridePickupLng),
            dropLat: Number(rideDropLat),
            dropLng: Number(rideDropLng)
        })
            .then((response) => {
                if (mounted) {
                    setRouteCoordinates(
                        Array.isArray(response.data.routeCoordinates)
                            ? response.data.routeCoordinates
                            : null
                    );

                    setRouteError("");
                }
            })
            .catch(() => {
                if (mounted) {
                    setRouteCoordinates(null);
                    setRouteError(
                        "The road route could not be loaded; the map shows a straight-line connector."
                    );
                }
            });

        return () => {
            mounted = false;
        };
    }, [
        ridePickupLat,
        ridePickupLng,
        rideDropLat,
        rideDropLng
    ]);

    // Pickup, destination and latest driver GPS position.
    const pickup = ride
        ? getPoint(ride.pickupLat, ride.pickupLng)
        : null;

    const drop = ride
        ? getPoint(ride.dropLat, ride.dropLng)
        : null;

    const driver = ride?.cab?.driver;
    const vehicle = ride?.cab;

    const driverLocation = vehicle
        ? getPoint(vehicle.latitude, vehicle.longitude)
        : null;

    // Trip status.
    const statusIndex = tripSteps.findIndex(
        (step) => step.status === ride?.status
    );

    const currentStepIndex =
        ride?.status === "CANCELLED" ? -1 : statusIndex;

    const statusTitle =
        tripSteps.find((step) => step.status === ride?.status)?.title ||
        (ride?.status === "CANCELLED"
            ? "Ride cancelled"
            : "Status unavailable");

    // Calculate distance from the latest driver position.
    const approachDistance =
        driverLocation && pickup
            ? distanceBetween(driverLocation, pickup)
            : null;

    const destinationDistance =
        driverLocation && drop
            ? distanceBetween(driverLocation, drop)
            : null;

    // Before trip starts: driver to pickup.
    // After trip starts: driver to destination.
    const displayedDistance =
        ride?.status === "STARTED"
            ? destinationDistance
            : ["REQUESTED", "ACCEPTED"].includes(ride?.status)
                ? approachDistance
                : null;

    // Approximate ETA at 25 km/h.
    const estimatedMinutes =
        displayedDistance !== null
            ? Math.max(1, Math.ceil(displayedDistance / 25 * 60))
            : null;

    // Address labels.
    const destinationLabel =
        ride?.dropoffAddress ||
        searchParams.get("drop") ||
        (drop
            ? `${drop.lat.toFixed(5)}, ${drop.lng.toFixed(5)}`
            : "Destination unavailable");

    const pickupLabel =
        ride?.pickupAddress ||
        searchParams.get("pickup") ||
        (pickup
            ? `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`
            : "Pickup unavailable");

    const billing = ride?.billing;

    return (
        <div className="tracking-page">
            <Navbar />

            <main className="tracking-content">

                {/* Page heading */}
                <header className="tracking-heading">
                    <div>
                        <p className="tracking-eyebrow">
                            GOCAB RIDE STATUS
                        </p>

                        <h1>Track your ride</h1>

                        <p>
                            Stay up to date with your trip and driver details.
                        </p>
                    </div>

                    <Link
                        to="/history"
                        className="tracking-history-link"
                    >
                        Ride history <span aria-hidden="true">↗</span>
                    </Link>
                </header>

                {error && (
                    <p className="tracking-error" role="alert">
                        {String(error)}
                    </p>
                )}

                {/* Loading */}
                {loading && !ride ? (
                    <section
                        className="tracking-empty"
                        aria-live="polite"
                    >
                        <span
                            className="tracking-empty-icon"
                            aria-hidden="true"
                        >
                            ⌖
                        </span>

                        <h2>Loading your ride</h2>

                        <p>
                            Getting the latest trip and driver details…
                        </p>
                    </section>
                ) : !ride ? (

                    /* No ride */
                    <section className="tracking-empty">
                        <span
                            className="tracking-empty-icon"
                            aria-hidden="true"
                        >
                            ⌖
                        </span>

                        <h2>
                            {requestedRideId
                                ? "Ride details are not available yet"
                                : "No active rides"}
                        </h2>

                        <p>
                            {requestedRideId
                                ? "We couldn't find this booking in your account. Refresh in a moment or check your ride history."
                                : "Once you confirm a booking, your driver and trip progress will appear here."}
                        </p>

                        <Link
                            className="tracking-primary-link"
                            to="/book"
                        >
                            Book a ride
                        </Link>
                    </section>
                ) : (

                    /* Ride tracking */
                    <>
                        {/* Ride status banner */}
                        <section className="tracking-status-banner">
                            <span
                                className={`tracking-status-indicator status-${String(
                                    ride.status
                                ).toLowerCase()}`}
                                aria-hidden="true"
                            ></span>

                            <div>
                                <span className="tracking-status-label">
                                    TRIP STATUS
                                </span>

                                <h2>{statusTitle}</h2>

                                <p>
                                    {ride.status === "REQUESTED" &&
                                        "Your ride request is confirmed. We're waiting for the driver to accept."}

                                    {ride.status === "ACCEPTED" &&
                                        "Your driver has accepted the ride and is heading to the pickup."}

                                    {ride.status === "STARTED" &&
                                        "Your trip is underway. Follow the route and check your destination below."}

                                    {ride.status === "COMPLETED" &&
                                        "Your ride is complete. Thanks for riding with GoCab."}

                                    {ride.status === "CANCELLED" &&
                                        "This ride was cancelled. Book another ride whenever you're ready."}
                                </p>
                            </div>

                            <div className="tracking-reference">
                                <span>RIDE ID</span>
                                <strong>#{ride.id}</strong>
                            </div>
                        </section>

                        <div className="tracking-grid">

                            {/* Map */}
                            <section
                                className="tracking-map-card"
                                aria-label="Ride route map"
                            >
                                {pickup || drop ? (
                                    <MapComponent
                                        pickup={pickup}
                                        drop={drop}
                                        vehicle={driverLocation}
                                        routeCoordinates={routeCoordinates}
                                        interactive={false}
                                    />
                                ) : (
                                    <div className="tracking-map-unavailable">
                                        Map coordinates are not available for this ride.
                                    </div>
                                )}

                                <div className="tracking-map-legend">
                                    <span>
                                        <i className="tracking-legend-pickup"></i>
                                        Pickup
                                    </span>

                                    <span>
                                        <i className="tracking-legend-driver"></i>
                                        Driver
                                    </span>

                                    <span>
                                        <i className="tracking-legend-drop"></i>
                                        Destination
                                    </span>
                                </div>

                                <p className="tracking-map-note">
                                    {driverLocation
                                        ? "Driver location is provided by the latest GPS update."
                                        : "Driver GPS location hasn't been shared yet."}
                                </p>

                                {routeError && (
                                    <p
                                        className="tracking-map-note tracking-map-error"
                                        role="status"
                                    >
                                        {routeError}
                                    </p>
                                )}
                            </section>

                            <div className="tracking-details">

                                {/* Trip progress */}
                                <section className="tracking-card tracking-progress-card">
                                    <div className="tracking-card-heading">
                                        <div>
                                            <p className="tracking-eyebrow">
                                                YOUR JOURNEY
                                            </p>

                                            <h2>Trip progress</h2>
                                        </div>

                                        <span className="tracking-live-pill">
                                            <i></i> UPDATES LIVE
                                        </span>
                                    </div>

                                    <ol className="tracking-timeline">
                                        {tripSteps.map((step, index) => {
                                            const completed =
                                                currentStepIndex >= index;

                                            const current =
                                                currentStepIndex === index;

                                            return (
                                                <li
                                                    key={step.status}
                                                    className={`${completed
                                                        ? "is-complete"
                                                        : ""} ${current
                                                            ? "is-current"
                                                            : ""}`}
                                                >
                                                    <span className="tracking-step-marker">
                                                        {completed
                                                            ? "✓"
                                                            : index + 1}
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {step.title}
                                                        </strong>

                                                        <small>
                                                            {step.detail}
                                                        </small>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>

                                    <p className="tracking-refresh-note">
                                        {lastUpdated
                                            ? `Ride details refresh every 15 seconds · Updated ${lastUpdated.toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                }
                                            )}`
                                            : "Ride details refresh every 15 seconds"}
                                    </p>
                                </section>

                                {/* Driver information */}
                                <section className="tracking-card tracking-driver-card">
                                    <div className="tracking-card-heading">
                                        <div>
                                            <p className="tracking-eyebrow">
                                                YOUR DRIVER
                                            </p>

                                            <h2>
                                                {driver?.name ||
                                                    "Driver details pending"}
                                            </h2>
                                        </div>

                                        <span
                                            className="tracking-driver-avatar"
                                            aria-hidden="true"
                                        >
                                            {driver?.name
                                                ?.trim()
                                                ?.charAt(0)
                                                ?.toUpperCase() || "D"}
                                        </span>
                                    </div>

                                    <div className="tracking-driver-meta">
                                        <div>
                                            <span>VEHICLE</span>
                                            <strong>
                                                {vehicle?.model ||
                                                    "Vehicle details pending"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>LICENSE PLATE</span>
                                            <strong>
                                                {vehicle?.carNumber ||
                                                    "Not available"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>DRIVER ID</span>
                                            <strong>
                                                {driver?.driverId ||
                                                    "Not available"}
                                            </strong>
                                        </div>
                                    </div>

                                    {driver?.phone && (
                                        <a
                                            className="tracking-call-button"
                                            href={`tel:${encodeURIComponent(
                                                driver.phone
                                            )}`}
                                        >
                                            <span aria-hidden="true">☎</span>
                                            Call driver
                                        </a>
                                    )}

                                    <p className="tracking-safety-note">
                                        Before boarding, verify the driver and
                                        vehicle match these details.
                                    </p>
                                </section>

                                {/* Route and trip details */}
                                <section className="tracking-card tracking-route-card">
                                    <div className="tracking-card-heading">
                                        <div>
                                            <p className="tracking-eyebrow">
                                                TRIP DETAILS
                                            </p>

                                            <h2>Your route</h2>
                                        </div>
                                    </div>

                                    <div className="tracking-route-point">
                                        <span className="tracking-route-dot pickup-dot"></span>

                                        <div>
                                            <small>PICKUP</small>

                                            <strong title={pickupLabel}>
                                                {pickupLabel}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="tracking-route-point">
                                        <span className="tracking-route-dot drop-dot"></span>

                                        <div>
                                            <small>DESTINATION</small>

                                            <strong title={destinationLabel}>
                                                {destinationLabel}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="tracking-trip-stats">

                                        {displayedDistance !== null && (
                                            <div>
                                                <span>
                                                    {ride.status === "STARTED"
                                                        ? "DRIVER TO DESTINATION"
                                                        : "DRIVER TO PICKUP"}
                                                </span>

                                                <strong>
                                                    {displayedDistance.toFixed(1)} km
                                                </strong>
                                            </div>
                                        )}

                                        {estimatedMinutes !== null && (
                                            <div>
                                                <span>ETA EST.</span>

                                                <strong>
                                                    {formatEstimatedTime(
                                                        estimatedMinutes
                                                    )}
                                                </strong>
                                            </div>
                                        )}

                                        <div>
                                            <span>RIDE FARE</span>

                                            <strong>
                                                {formatCurrency(
                                                    billing?.fare ?? ride.fare
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>GST (18%)</span>

                                            <strong>
                                                {formatCurrency(
                                                    billing?.gstAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>TOTAL BILL</span>

                                            <strong>
                                                {formatCurrency(
                                                    billing?.totalAmount
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>CAR TYPE</span>

                                            <strong>
                                                {vehicle?.model ||
                                                    "Assigned vehicle"}
                                            </strong>
                                        </div>
                                    </div>

                                    <p className="tracking-estimate-note">
                                        Distance is calculated using the
                                        driver's latest GPS position.
                                        ETA is approximate, assumes an average
                                        speed of 25 km/h, and does not include
                                        live traffic.
                                    </p>
                                </section>

                                {/* Payment */}
                                {ride.status === "COMPLETED" && (
                                    <button
                                        type="button"
                                        className="btn btn-primary tracking-payment-button"
                                        onClick={() =>
                                            navigate(
                                                `/payment?fare=${encodeURIComponent(
                                                    billing?.totalAmount ??
                                                    ride.fare ??
                                                    ""
                                                )}&rideId=${encodeURIComponent(
                                                    ride.id
                                                )}`
                                            )
                                        }
                                    >
                                        Continue to payment
                                        <span aria-hidden="true">→</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default LiveTrack;
