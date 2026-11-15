import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getRideHistory } from "../services/rideService";

const activeStatuses = ["REQUESTED", "ACCEPTED", "STARTED"];

function formatLocation(address, latitude, longitude) {
    if (address) return address;
    if (latitude == null || longitude == null) return "Location unavailable";
    return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function formatRideDate(value) {
    if (!value) return "Booking date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Booking date unavailable";
    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function getErrorMessage(error) {
    const responseData = error.response?.data;
    if (typeof responseData === "string" && responseData.trim()) return responseData;
    if (responseData && typeof responseData === "object") {
        const message = responseData.message || responseData.detail || responseData.error;
        if (typeof message === "string" && message.trim()) return message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
        return "Your session has expired. Sign in again to view your bookings.";
    }
    if (error.response?.status) return error.message || "Could not load your bookings.";
    return "Could not connect to GoCab. Check that the backend is running and try again.";
}

function RideHistory() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const loadRides = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getRideHistory(localStorage.getItem("token"));
            if (!Array.isArray(response.data)) {
                throw new Error("The server returned an invalid booking list.");
            }
            setRides(response.data);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRides();
    }, [loadRides]);

    const sortedRides = useMemo(() => [...rides].sort((first, second) => {
        const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : Number(first.id) || 0;
        const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : Number(second.id) || 0;
        return secondDate - firstDate;
    }), [rides]);

    const activeCount = rides.filter((ride) => activeStatuses.includes(ride.status)).length;
    const completedCount = rides.filter((ride) => ride.status === "COMPLETED").length;
    const openRide = (ride) => {
        const params = new URLSearchParams({ rideId: String(ride.id) });
        params.set("pickup", formatLocation(ride.pickupAddress, ride.pickupLat, ride.pickupLng));
        params.set("drop", formatLocation(ride.dropoffAddress, ride.dropLat, ride.dropLng));
        navigate(`/live-track?${params.toString()}`);
    };

    return (
        <div className="ride-history-page">
            <Navbar />
            <main className="ride-history-content">
                <header className="ride-history-heading">
                    <div>
                        <p className="ride-history-eyebrow">YOUR ACCOUNT</p>
                        <h1>Ride history</h1>
                        <p>Review your bookings, routes, driver details, and fares.</p>
                    </div>
                    <Link to="/book" className="ride-history-book-link">＋ Book a ride</Link>
                </header>

                <section className="ride-history-summary" aria-label="Ride summary">
                    <article><span>TOTAL BOOKINGS</span><strong>{loading ? "—" : rides.length}</strong><small>All rides in your account</small></article>
                    <article><span>ACTIVE RIDES</span><strong>{loading ? "—" : activeCount}</strong><small>Requested, assigned, or in progress</small></article>
                    <article><span>COMPLETED</span><strong>{loading ? "—" : completedCount}</strong><small>Successfully completed trips</small></article>
                </section>

                <section className="ride-history-list-section">
                    <div className="ride-history-list-heading">
                        <div><p className="ride-history-eyebrow">BOOKINGS</p><h2>All rides</h2></div>
                        {!loading && rides.length > 0 && <span>{rides.length} {rides.length === 1 ? "ride" : "rides"}</span>}
                    </div>

                    {loading && (
                        <div className="ride-history-message" role="status">
                            <span className="ride-history-spinner" aria-hidden="true"></span>
                            <p>Loading your ride history…</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="ride-history-message ride-history-error" role="alert">
                            <p>{error}</p>
                            <button className="btn btn-primary" type="button" onClick={loadRides}>Try again</button>
                        </div>
                    )}

                    {!loading && !error && sortedRides.length === 0 && (
                        <div className="ride-history-message ride-history-empty">
                            <span aria-hidden="true">⌖</span>
                            <h3>No rides yet</h3>
                            <p>Your confirmed bookings will show up here with their route, fare, and driver details.</p>
                            <Link to="/book" className="ride-history-book-link">Book your first ride</Link>
                        </div>
                    )}

                    {!loading && !error && sortedRides.length > 0 && (
                        <div className="ride-history-list">
                            {sortedRides.map((ride) => {
                                const driver = ride.cab?.driver;
                                const status = ride.status || "UNKNOWN";
                                return (
                                    <article className="ride-history-card" key={ride.id}>
                                        <div className="ride-history-card-top">
                                            <div>
                                                <span className="ride-history-reference">GOCAB RIDE · #{ride.id ?? "—"}</span>
                                                <p className="ride-history-date">{formatRideDate(ride.createdAt)}</p>
                                            </div>
                                            <span className={`ride-history-status status-${status.toLowerCase()}`}>
                                                {status.replace(/_/g, " ")}
                                            </span>
                                        </div>

                                        <div className="ride-history-route">
                                            <div className="ride-history-route-point">
                                                <i className="history-pickup-dot" aria-hidden="true"></i>
                                                <div><small>PICKUP</small><strong title={ride.pickupAddress || ""}>
                                                    {formatLocation(ride.pickupAddress, ride.pickupLat, ride.pickupLng)}
                                                </strong></div>
                                            </div>
                                            <div className="ride-history-route-point">
                                                <i className="history-drop-dot" aria-hidden="true"></i>
                                                <div><small>DESTINATION</small><strong title={ride.dropoffAddress || ""}>
                                                    {formatLocation(ride.dropoffAddress, ride.dropLat, ride.dropLng)}
                                                </strong></div>
                                            </div>
                                        </div>

                                        <div className="ride-history-details">
                                            <div><span>DRIVER</span><strong>{driver?.name || "Not assigned"}</strong></div>
                                            <div><span>VEHICLE</span><strong>{ride.cab?.model || "Not assigned"}</strong></div>
                                            <div><span>LICENSE PLATE</span><strong>{ride.cab?.carNumber || "—"}</strong></div>
                                            <div><span>DISTANCE</span><strong>{Number.isFinite(Number(ride.distanceKm)) && ride.distanceKm != null
                                                ? `${Number(ride.distanceKm).toFixed(1)} km`
                                                : "—"}</strong></div>
                                            <div><span>BILLING ID</span><strong>{ride.billing?.id
                                                ? `BILL-${String(ride.billing.id).padStart(6, "0")}`
                                                : "Pending"}</strong></div>
                                            <div><span>GST (18%)</span><strong>{ride.billing?.gstAmount == null
                                                ? "Pending"
                                                : `₹${Number(ride.billing.gstAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</strong></div>
                                            <div><span>RIDE FARE</span><strong>{ride.billing?.fare == null
                                                ? "Pending"
                                                : `₹${Number(ride.billing.fare).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</strong></div>
                                            <div className="ride-history-fare"><span>TOTAL BILL</span><strong>{ride.billing?.totalAmount == null
                                                ? "Pending"
                                                : `₹${Number(ride.billing.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</strong></div>
                                        </div>

                                        <div className="ride-history-card-footer">
                                            <span>{driver?.phone ? `Driver contact: ${driver.phone}` : "Driver contact unavailable"}</span>
                                            <button className="btn btn-outline-primary" type="button" onClick={() => openRide(ride)}>
                                                View ride details <span aria-hidden="true">→</span>
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default RideHistory;
