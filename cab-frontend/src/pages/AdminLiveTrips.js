import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import { fetchRides, formatDate } from "../services/adminService";

function elapsedSince(value) {
    const start = new Date(value).getTime();
    if (Number.isNaN(start)) return "—";
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - start) / 60000));
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function AdminLiveTrips() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const mounted = useRef(false);

    const refresh = useCallback(async (initial = false) => {
        if (initial) setLoading(true);
        try {
            const allRides = await fetchRides();
            if (!mounted.current) return;
            setRides(allRides);
            setLastUpdated(new Date());
            setError("");
        } catch {
            if (mounted.current) setError("Live trip data could not be refreshed. Check the backend connection and retry.");
        } finally {
            if (initial && mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        refresh(true);
        const interval = window.setInterval(() => refresh(), 30000);
        return () => {
            mounted.current = false;
            window.clearInterval(interval);
        };
    }, [refresh]);

    const liveTrips = useMemo(() => rides.filter((ride) => ["ACCEPTED", "STARTED"].includes(ride.status)), [rides]);
    const hasStartTime = liveTrips.some((ride) => ride.startedAt || ride.startTime);

    return (
        <div className="admin-data-page">
            <AdminPageHeader title="Live trips" description="Accepted and started trips across all employees." actions={<>
                <span className="admin-live-pill">LIVE · Refreshes every 30 seconds</span>
                <button className="admin-refresh-button" type="button" onClick={() => refresh()} disabled={loading}>↻ Refresh</button>
            </>} />
            {lastUpdated && <p className="admin-refresh-meta">Last updated {lastUpdated.toLocaleTimeString("en-IN")}</p>}
            {error && <div className="admin-error-state" role="alert"><span>{error}</span><button type="button" onClick={() => refresh(true)}>Retry</button></div>}
            <section className="admin-panel admin-list-panel">
                <div className="admin-panel-heading admin-list-heading"><div><h2>Trips in progress</h2><p>{loading ? "Loading…" : `${liveTrips.length} live ${liveTrips.length === 1 ? "trip" : "trips"}`}</p></div><span className="admin-live-pill">LIVE</span></div>
                <div className="admin-table-scroll">
                    <table className="admin-booking-table admin-full-table">
                        <thead><tr>
                            <th>Employee</th><th>Driver</th><th>Vehicle</th><th>Pickup → drop</th><th>Status</th>
                            {hasStartTime && <th>Start time</th>}
                            {hasStartTime && <th>Elapsed</th>}
                        </tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan={hasStartTime ? 7 : 5} className="admin-table-message">Loading live trips…</td></tr>}
                            {!loading && !error && liveTrips.length === 0 && <tr><td colSpan={hasStartTime ? 7 : 5} className="admin-table-message">No live trips right now</td></tr>}
                            {!loading && !error && liveTrips.map((ride) => {
                                const startTime = ride.startedAt || ride.startTime;
                                return <tr key={ride.id}>
                                    <td><strong>{ride.employeeName || "—"}</strong><small>{ride.employeeId || ride.employeeEmail || ""}</small></td>
                                    <td>{ride.driverName || "Unassigned"}</td>
                                    <td>{[ride.vehicleModel, ride.vehicleRegistration].filter(Boolean).join(" · ") || "—"}</td>
                                    <td><strong>{ride.pickupAddress || "—"}</strong><small>↳ {ride.dropoffAddress || "—"}</small></td>
                                    <td><span className={`booking-status status-${String(ride.status).toLowerCase()}`}>{ride.status === "STARTED" ? "In progress" : "Accepted"}</span></td>
                                    {hasStartTime && <td>{startTime ? formatDate(startTime) : "—"}</td>}
                                    {hasStartTime && <td>{startTime ? elapsedSince(startTime) : "—"}</td>}
                                </tr>;
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="admin-table-footer">Start time and elapsed time are shown only when the ride record provides a start timestamp.</p>
            </section>
        </div>
    );
}

export default AdminLiveTrips;
