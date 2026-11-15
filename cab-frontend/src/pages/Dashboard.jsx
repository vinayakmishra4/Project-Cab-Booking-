
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocationSearchField from "../components/LocationSearchField";
import { getRideHistory } from "../services/rideService";
import { Client } from "@stomp/stompjs";

const activeStatuses = ["REQUESTED", "ACCEPTED", "STARTED"];

function Dashboard() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [pickupLocation, setPickupLocation] = useState(null);
    const [dropoffLocation, setDropoffLocation] = useState(null);
    const [bookingError, setBookingError] = useState("");

    const navigate = useNavigate();

    const email = localStorage.getItem("userEmail") || "";
    const storedName = localStorage.getItem("userName");

    const firstName =
        storedName?.trim().split(/\s+/)[0] ||
        email.split("@")[0]?.split(/[._-]/)[0] ||
        "there";

    const initials = firstName.slice(0, 1).toUpperCase();

    // Fetch the latest ride information.
    const loadRides = useCallback(async (silent = false) => {
        try {
            const response = await getRideHistory();

            if (!Array.isArray(response.data)) {
                throw new Error("Invalid ride list received from server.");
            }

            setRides(response.data);
            setError("");
        } catch (requestError) {
            if (!silent) {
                setError(
                    requestError.response?.data?.message ||
                    "Your bookings are temporarily unavailable. Please try again later."
                );
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and instant ride-status updates through WebSocket.
    useEffect(() => {
    // Load existing rides when the dashboard opens.
        loadRides();

    const token = localStorage.getItem("token");

    if (!token) {
        console.error("WebSocket connection skipped: JWT token not found.");
        return;
    }

    const wsProtocol =
        window.location.protocol === "https:" ? "wss:" : "ws:";

    const client = new Client({
        brokerURL: `${wsProtocol}//${window.location.hostname}:8080/ws`,

        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },

        reconnectDelay: 5000,

        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
            console.log("Employee ride notifications connected.");

            client.subscribe("/user/queue/ride-updates", (message) => {
                try {
                    const notification = JSON.parse(message.body);

                    console.log("Ride status update received:", notification);

                    // Immediately fetch the latest ride information.
                    loadRides(true);
                } catch (notificationError) {
                    console.error(
                        "Could not process ride notification:",
                        notificationError
                    );
                }
            });
        },

        onStompError: (frame) => {
            console.error("WebSocket STOMP error:", frame.headers.message);
        },

        onWebSocketError: (event) => {
            console.error("WebSocket connection error:", event);
        },
    });

    client.activate();

    return () => {
        client.deactivate();
    };
}, [loadRides]);

    const upcomingRide = rides.find((ride) =>
        activeStatuses.includes(ride.status)
    );

    const recentRides = [...rides]
        .sort((first, second) => Number(second.id) - Number(first.id))
        .slice(0, 4);

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("portal");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");

        navigate("/", { replace: true });
    };

    const startBooking = (event) => {
        event.preventDefault();

        if (!pickupLocation || !dropoffLocation) {
            setBookingError(
                "Choose both pickup and destination from the location search suggestions."
            );
            return;
        }

        setBookingError("");

        const params = new URLSearchParams();

        params.set("pickup", pickupLocation.label);
        params.set("pickupLat", String(pickupLocation.lat));
        params.set("pickupLng", String(pickupLocation.lng));

        params.set("drop", dropoffLocation.label);
        params.set("dropLat", String(dropoffLocation.lat));
        params.set("dropLng", String(dropoffLocation.lng));

        navigate(`/book?${params.toString()}`);
    };

    return (
        <div className="employee-workspace">
            <aside className="employee-sidebar">

                <Link
                    to="/dashboard"
                    className="employee-brand"
                    aria-label="GoCab employee mobility home"
                >
                    <span className="brand-mark">M</span>

                    <span className="brand-copy">
                        <strong className="brand-word">
                            Go<span>Cab</span>
                        </strong>
                        <small>EMPLOYEE MOBILITY</small>
                    </span>
                </Link>

                <p className="employee-sidebar-label">WORKSPACE</p>

                <nav className="employee-nav" aria-label="Employee workspace">
                    <Link to="/dashboard" className="active">
                        <span aria-hidden="true">▦</span> Dashboard
                    </Link>

                    <Link to="/history">
                        <span aria-hidden="true">▤</span> My bookings
                        {!loading && !error && rides.length > 0 && (
                            <span
                                className="employee-nav-count"
                                aria-label={`${rides.length} bookings`}
                            >
                                {rides.length}
                            </span>
                        )}
                    </Link>

                    <Link to="/book">
                        <span aria-hidden="true">⌖</span> Book a cab
                    </Link>

                    <Link to="/live-track">
                        <span aria-hidden="true">◎</span> Live tracking
                    </Link>
                </nav>

                <div className="employee-workplace-card">
                    <span className="employee-sidebar-label">
                        YOUR WORKPLACE
                    </span>

                    <strong>
                        <span aria-hidden="true">⌂</span> Motherson mobility
                    </strong>

                    <small>Employee travel workspace</small>
                </div>

                <div className="employee-sidebar-bottom">
                    <div className="employee-support-card">
                        <span className="employee-support-icon" aria-hidden="true">
                            ?
                        </span>

                        <strong>Need a hand?</strong>

                        <p>
                            Book a ride or review your recent bookings from this dashboard.
                        </p>

                        <Link to="/history">
                            View my bookings <span aria-hidden="true">↗</span>
                        </Link>
                    </div>

                    <button
                        className="btn btn-outline-primary employee-signout"
                        type="button"
                        onClick={signOut}
                    >
                        <span aria-hidden="true">↪</span> Sign out
                    </button>

                    <small className="employee-copyright">
                        © GoCab · Employee mobility
                    </small>
                </div>
            </aside>

            <div className="employee-main">

                <header className="employee-topbar">
                    <div className="employee-breadcrumb">
                        <span>Employee portal</span>
                        <b aria-hidden="true">›</b>
                        <strong>Mobility dashboard</strong>
                    </div>

                    <div className="employee-account">
                        <span className="employee-safety">
                            <span aria-hidden="true">◇</span>
                            Your safety, our priority
                        </span>

                        <span className="employee-avatar" aria-hidden="true">
                            {initials}
                        </span>

                        <span className="employee-account-name">
                            <strong>{storedName || firstName}</strong>
                            <small>Employee</small>
                        </span>
                    </div>
                </header>

                <main className="employee-dashboard-content">

                    <section className="employee-greeting">
                        <div>
                            <h1>Good afternoon, {firstName}.</h1>
                            <p>
                                From your desk to your destination, your next journey starts here.
                            </p>
                        </div>

                        <span className="employee-current-date">
                            {new Date().toLocaleDateString(undefined, {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </span>
                    </section>

                    <div className="employee-notice">
                        <strong>Mobility dashboard</strong>
                        <span>
                            Book a cab, keep track of your active ride, and find your recent bookings.
                        </span>
                    </div>

                    {error && (
                        <p className="dashboard-message" role="alert">
                            {error}
                        </p>
                    )}

                    <section className="employee-primary-grid">

                        {/* Booking panel */}
                        <article className="employee-panel employee-booking-panel">
                            <div className="employee-panel-heading">
                                <div>
                                    <h2>Book a cab</h2>
                                    <p>Where would you like to go?</p>
                                </div>

                                <span className="instant-ride-badge">
                                    <i></i> On-demand
                                </span>
                            </div>

                            <form
                                className="employee-booking-form"
                                onSubmit={startBooking}
                            >
                                <label>
                                    Pickup

                                    <LocationSearchField
                                        label="Pickup location"
                                        value={pickup}
                                        selected={Boolean(pickupLocation)}
                                        placeholder="Search pickup location"
                                        inputClassName="employee-location-input"
                                        markerClassName="pickup-dot"
                                        onChange={(value) => {
                                            setPickup(value);
                                            setPickupLocation(null);
                                            setBookingError("");
                                        }}
                                        onSelect={(location) => {
                                            setPickup(location.label);
                                            setPickupLocation(location);
                                            setBookingError("");
                                        }}
                                    />
                                </label>

                                <label>
                                    Drop-off

                                    <LocationSearchField
                                        label="Destination"
                                        value={dropoff}
                                        selected={Boolean(dropoffLocation)}
                                        placeholder="Search destination"
                                        inputClassName="employee-location-input"
                                        markerClassName="dropoff-dot"
                                        onChange={(value) => {
                                            setDropoff(value);
                                            setDropoffLocation(null);
                                            setBookingError("");
                                        }}
                                        onSelect={(location) => {
                                            setDropoff(location.label);
                                            setDropoffLocation(location);
                                            setBookingError("");
                                        }}
                                    />
                                </label>

                                <p className="employee-booking-hint">
                                    Select a matching place from the search results for each location.
                                </p>

                                {bookingError && (
                                    <p
                                        className="employee-booking-error"
                                        role="alert"
                                    >
                                        {bookingError}
                                    </p>
                                )}

                                <button
                                    className="btn btn-primary employee-booking-submit"
                                    type="submit"
                                >
                                    Find available cabs
                                    <span aria-hidden="true">→</span>
                                </button>
                            </form>

                            <div className="employee-booking-footnote">
                                <span aria-hidden="true">◇</span>
                                Your ride details are handled securely.
                            </div>
                        </article>

                        {/* Upcoming ride */}
                        <article className="employee-panel employee-upcoming-panel">
                            <div className="employee-panel-heading">
                                <div>
                                    <h2>Your upcoming ride</h2>
                                    <p>
                                        {upcomingRide
                                            ? "Your active booking is ready to view."
                                            : "Your active ride will appear here."}
                                    </p>
                                </div>

                                {upcomingRide && (
                                    <span className="ride-status-badge">
                                        {upcomingRide.status
                                            ?.toLowerCase()
                                            .replace("_", " ")}
                                    </span>
                                )}
                            </div>

                            <div
                                className="employee-map-preview"
                                role="img"
                                aria-label="Illustrative map preview, not a live route"
                            >
                                <svg
                                    className="map-streets"
                                    viewBox="0 0 640 190"
                                    preserveAspectRatio="none"
                                    aria-hidden="true"
                                >
                                    <path d="M-20 45 100 48 150 8 220 50 290 39 350 83 430 35 510 59 670 15M-10 115 105 112 165 166 232 115 315 128 375 91 445 132 515 107 660 154M75-10 119 48 102 110 145 197M265-10 248 47 282 91 260 132 300 200M390-10 365 78 402 128 387 200M540-10 523 60 548 108 530 200" />
                                    <path
                                        className="map-route"
                                        d="M125 54 220 54 270 120 355 95 415 137 500 93"
                                    />
                                </svg>

                                <span className="map-place map-place-start">
                                    <i></i>
                                    {upcomingRide ? "Pickup" : "Your pickup"}
                                </span>

                                <span className="map-place map-place-end">
                                    <i></i>
                                    Destination
                                </span>

                                <span className="map-grid-label">
                                    ROUTE PREVIEW
                                </span>
                            </div>

                            {upcomingRide ? (
                                <div className="employee-upcoming-details">
                                    <span>Booking #{upcomingRide.id}</span>

                                    <strong>
                                        {upcomingRide.fare == null
                                            ? "Fare pending"
                                            : `₹${upcomingRide.fare}`}
                                    </strong>
                                </div>
                            ) : (
                                <p className="employee-empty-upcoming">
                                    {loading
                                        ? "Checking for active rides…"
                                        : "No active rides right now."}
                                </p>
                            )}

                            <Link
                                className="employee-track-link"
                                to={upcomingRide
                                    ? `/live-track?rideId=${encodeURIComponent(upcomingRide.id)}`
                                    : "/book"}
                            >
                                {upcomingRide
                                    ? "Open live tracking"
                                    : "Book your first ride"}
                                <span aria-hidden="true">↗</span>
                            </Link>
                        </article>
                    </section>

                    {/* Recent bookings */}
                    <section className="employee-secondary-grid">
                        <article className="employee-panel employee-recent-panel">
                            <div className="employee-panel-heading">
                                <div>
                                    <h2>Recent bookings</h2>
                                    <p>Your latest ride activity.</p>
                                </div>

                                <Link
                                    to="/history"
                                    className="employee-view-all"
                                >
                                    View all bookings
                                    <span aria-hidden="true">→</span>
                                </Link>
                            </div>

                            {loading ? (
                                <p className="employee-bookings-empty">
                                    Loading your bookings…
                                </p>
                            ) : recentRides.length ? (
                                <div className="employee-bookings-table-wrap">
                                    <table className="table employee-bookings-table">
                                        <thead>
                                            <tr>
                                                <th>BOOKING</th>
                                                <th>JOURNEY</th>
                                                <th>FARE</th>
                                                <th>STATUS</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {recentRides.map((ride) => (
                                                <tr key={ride.id}>
                                                    <td>
                                                        <strong>#{ride.id}</strong>
                                                    </td>

                                                    <td>
                                                        <span className="booking-journey">
                                                            Ride route
                                                        </span>

                                                        <small>
                                                            {ride.pickupLat != null &&
                                                            ride.pickupLng != null &&
                                                            ride.dropLat != null &&
                                                            ride.dropLng != null
                                                                ? `${Number(ride.pickupLat).toFixed(3)}, ${Number(ride.pickupLng).toFixed(3)} → ${Number(ride.dropLat).toFixed(3)}, ${Number(ride.dropLng).toFixed(3)}`
                                                                : "Ride details"}
                                                        </small>
                                                    </td>

                                                    <td>
                                                        {ride.fare == null
                                                            ? "—"
                                                            : `₹${ride.fare}`}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`booking-status ${
                                                                ride.status === "COMPLETED"
                                                                    ? "completed"
                                                                    : ""
                                                            }`}
                                                        >
                                                            {ride.status
                                                                ?.toLowerCase()
                                                                .replace("_", " ") ||
                                                                "Unknown"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="employee-bookings-empty">
                                    <strong>No bookings yet</strong>
                                    <span>
                                        Your ride history will show here after your first booking.
                                    </span>
                                </div>
                            )}
                        </article>

                        {/* Helpful reminders */}
                        <article className="employee-panel employee-tips-panel">
                            <div className="employee-panel-heading">
                                <div>
                                    <h2>Good to know</h2>
                                    <p>A few helpful reminders.</p>
                                </div>
                            </div>

                            <div className="employee-tip">
                                <span aria-hidden="true">◷</span>
                                <div>
                                    <strong>Plan ahead</strong>
                                    <p>
                                        Enter your pickup and destination to get started with a ride.
                                    </p>
                                </div>
                            </div>

                            <div className="employee-tip">
                                <span aria-hidden="true">◇</span>
                                <div>
                                    <strong>Your journey, protected</strong>
                                    <p>
                                        Keep your ride details handy while your booking is active.
                                    </p>
                                </div>
                            </div>

                            <Link
                                to="/history"
                                className="employee-policy-link"
                            >
                                Review your ride history
                                <span aria-hidden="true">↗</span>
                            </Link>
                        </article>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;
