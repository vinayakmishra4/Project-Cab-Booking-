import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const emptyDashboard = {
    totalBookings: 0,
    completedTrips: 0,
    tripsInProgress: 0,
    pendingRides: 0,
    totalEmployees: 0,
    totalDrivers: 0,
    totalAdmins: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    onlineVehicles: 0,
    bookingTrend: [],
    recentBookings: []
};

const statusLabels = {
    REQUESTED: "Pending",
    ACCEPTED: "Accepted",
    STARTED: "In progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
};

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function AdminDashboard() {
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [serviceStatus, setServiceStatus] = useState("checking");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bookingFilter, setBookingFilter] = useState("ALL");
    const email = localStorage.getItem("userEmail") || "";

    const loadDashboard = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const response = await api.get("/api/admin/dashboard");
            setDashboard({ ...emptyDashboard, ...response.data });
            setServiceStatus("connected");
            setError("");
        } catch {
            setServiceStatus("unavailable");
            setError("Dashboard data could not be loaded. Check the backend connection and try again.");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const refresh = async (showLoading) => {
            if (showLoading) setLoading(true);
            try {
                const response = await api.get("/api/admin/dashboard");
                if (mounted) {
                    setDashboard({ ...emptyDashboard, ...response.data });
                    setServiceStatus("connected");
                    setError("");
                }
            } catch {
                if (mounted) {
                    setServiceStatus("unavailable");
                    setError("Dashboard data could not be loaded. Check the backend connection and try again.");
                }
            } finally {
                if (mounted && showLoading) setLoading(false);
            }
        };
        refresh(true);
        const interval = window.setInterval(() => refresh(false), 30000);
        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, []);

    const bookings = useMemo(() => {
        const allBookings = Array.isArray(dashboard.recentBookings) ? dashboard.recentBookings : [];
        if (bookingFilter === "ALL") return allBookings;
        if (bookingFilter === "IN_PROGRESS") {
            return allBookings.filter((booking) => ["ACCEPTED", "STARTED"].includes(booking.status));
        }
        if (bookingFilter === "PENDING") {
            return allBookings.filter((booking) => booking.status === "REQUESTED");
        }
        return allBookings.filter((booking) => booking.status === bookingFilter);
    }, [bookingFilter, dashboard.recentBookings]);

    const trend = Array.isArray(dashboard.bookingTrend) ? dashboard.bookingTrend : [];
    const trendTotal = trend.reduce((total, point) => total + Number(point.count || 0), 0);
    const maxTrend = Math.max(1, ...trend.map((point) => Number(point.count || 0)));
    const chartPoints = trend.map((point, index) => {
        const x = trend.length < 2 ? 320 : 24 + index * (592 / (trend.length - 1));
        const y = 152 - (Number(point.count || 0) / maxTrend) * 112;
        return { x, y, ...point };
    });
    const linePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
    const areaPoints = chartPoints.length
        ? `${chartPoints[0].x},168 ${linePoints} ${chartPoints[chartPoints.length - 1].x},168`
        : "";
    const totalVehicles = Number(dashboard.totalVehicles || 0);
    const onlineVehicles = Math.min(totalVehicles, Number(dashboard.onlineVehicles || 0));
    const availableVehicles = Math.min(onlineVehicles, Number(dashboard.availableVehicles || 0));
    const busyVehicles = Math.max(0, onlineVehicles - availableVehicles);
    const offlineVehicles = Math.max(0, totalVehicles - onlineVehicles);
    const busyPercent = totalVehicles ? (busyVehicles / totalVehicles) * 100 : 0;
    const availablePercent = totalVehicles ? (availableVehicles / totalVehicles) * 100 : 0;
    const fleetGradient = totalVehicles
        ? `conic-gradient(#c8102e 0% ${busyPercent}%, #3b8c6e ${busyPercent}% ${busyPercent + availablePercent}%, #d7dce0 ${busyPercent + availablePercent}% 100%)`
        : "conic-gradient(#e9ecef 0% 100%)";

    const exportBookings = () => {
        const columns = ["Booking", "Employee", "Employee ID", "Route", "Driver", "Driver ID", "Vehicle", "Status", "Created", "Fare"];
        const values = bookings.map((booking) => [
            `GC-${booking.id}`,
            booking.employeeName,
            booking.employeeId,
            `${booking.pickupAddress || ""} to ${booking.dropoffAddress || ""}`,
            booking.driverName,
            booking.driverId,
            `${booking.vehicleModel || ""} ${booking.vehicleRegistration || ""}`.trim(),
            statusLabels[booking.status] || booking.status || "",
            booking.createdAt,
            booking.fare
        ]);
        const csv = [columns, ...values]
            .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
            .join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "gocab-recent-bookings.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("portal");
        localStorage.removeItem("userEmail");
        window.location.assign("/");
    };

    return (
        <div className="admin-portal">
            <aside className="admin-sidebar">
                <Link className="portal-side-brand" to="/admin">
                    <span className="brand-mark portal-brand-mark">M</span>
                    <span className="brand-word">My<span>GoCab</span></span>
                    <small>EMPLOYEE TRANSPORT</small>
                </Link>
                <div className="admin-workspace-badge">
                    <span className="admin-badge-mark">⌂</span>
                    <div><strong>Motherson India</strong><small>NCR operations</small></div>
                </div>
                <p className="side-nav-label">WORKSPACE</p>
                <a className="admin-side-link active" href="#overview"><span>▦</span> Overview</a>
                <a className="admin-side-link" href="#recent-bookings" onClick={() => setBookingFilter("ALL")}><span>▤</span> Bookings <b>{dashboard.totalBookings}</b></a>
                <a className="admin-side-link" href="#recent-bookings" onClick={() => setBookingFilter("IN_PROGRESS")}><span>◎</span> Live trips <b>{dashboard.tripsInProgress}</b></a>
                <a className="admin-side-link" href="#recent-bookings"><span>♙</span> Employees</a>
                <p className="side-nav-label side-nav-spaced">MANAGEMENT</p>
                <a className="admin-side-link" href="#fleet"><span>▣</span> Fleet</a>
                <Link className="admin-side-link" to="/drivers"><span>♧</span> Drivers</Link>
                <a className="admin-side-link" href="#booking-trends"><span>⌁</span> Reports</a>
                <a className="admin-side-link" href="#recent-bookings"><span>▧</span> Billing</a>
                <div className="admin-sidebar-bottom">
                    <div className="admin-user-avatar">{email.charAt(0).toUpperCase() || "A"}</div>
                    <div className="admin-user-info"><strong>Administrator</strong><span>{email}</span></div>
                    <button className="admin-signout" type="button" onClick={signOut} aria-label="Sign out">↪</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div><span className="breadcrumb-muted">Transport management</span><span className="breadcrumb-slash">/</span> Overview</div>
                    <div className="admin-topbar-right">
                        <span className={`service-indicator ${serviceStatus}`}><i></i>{serviceStatus === "checking" ? "Connecting" : serviceStatus === "connected" ? "System online" : "Service issue"}</span>
                        <span className="admin-date">{new Date().toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                </header>

                <div className="admin-content" id="overview">
                    <section className="admin-welcome">
                        <div>
                            <p className="eyebrow">LIVE TRANSPORT MANAGEMENT</p>
                            <h1>Transport overview <span className="admin-live-pill">LIVE</span></h1>
                            <p>A clear view of employee travel, drivers, and fleet activity.</p>
                        </div>
                        <button className="admin-refresh-button" type="button" onClick={() => loadDashboard(true)} disabled={loading}>
                            {loading ? "Refreshing…" : "↻ Refresh data"}
                        </button>
                    </section>

                    {error && <p className="dashboard-message" role="alert">{error}</p>}

                    <section className="admin-stat-grid" aria-label="Transport statistics">
                        <article className="admin-stat-card"><span className="admin-stat-icon">▤</span><p>Total bookings</p><strong>{loading ? "—" : dashboard.totalBookings.toLocaleString()}</strong><small>All employee and legacy-user rides</small></article>
                        <article className="admin-stat-card"><span className="admin-stat-icon green">✓</span><p>Trips completed</p><strong>{loading ? "—" : dashboard.completedTrips.toLocaleString()}</strong><small>Successfully completed rides</small></article>
                        <article className="admin-stat-card"><span className="admin-stat-icon amber">◎</span><p>Trips in progress</p><strong>{loading ? "—" : dashboard.tripsInProgress.toLocaleString()}</strong><small>Accepted or started trips</small></article>
                        <article className="admin-stat-card"><span className="admin-stat-icon slate">♙</span><p>Registered accounts</p><strong>{loading ? "—" : (dashboard.totalEmployees + dashboard.totalDrivers + dashboard.totalAdmins).toLocaleString()}</strong><small>{dashboard.totalEmployees} employees · {dashboard.totalDrivers} {dashboard.totalDrivers === 1 ? "driver" : "drivers"} · {dashboard.totalAdmins} {dashboard.totalAdmins === 1 ? "admin" : "admins"}</small></article>
                    </section>

                    <section className="admin-middle-grid">
                        <article className="admin-panel trend-panel" id="booking-trends">
                            <div className="admin-panel-heading">
                                <div><h2>Booking trends</h2><p><strong>{loading ? "—" : trendTotal.toLocaleString()}</strong> bookings <span>over the last 7 days</span></p></div>
                                <span className="trend-legend"><i></i> Daily bookings</span>
                            </div>
                            <div className="admin-chart-wrap">
                                <div className="admin-chart-y-labels"><span>{maxTrend}</span><span>{Math.round(maxTrend / 2)}</span><span>0</span></div>
                                <svg className="admin-trend-chart" viewBox="0 0 640 180" role="img" aria-label="Daily bookings over the last seven days">
                                    <defs><linearGradient id="booking-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c8102e" stopOpacity=".17"/><stop offset="100%" stopColor="#c8102e" stopOpacity="0"/></linearGradient></defs>
                                    {[40, 96, 152].map((y) => <line key={y} x1="20" x2="620" y1={y} y2={y} className="admin-chart-gridline" />)}
                                    {areaPoints && <polygon points={areaPoints} fill="url(#booking-area)" />}
                                    {linePoints && <polyline points={linePoints} className="admin-chart-line" />}
                                    {chartPoints.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" className="admin-chart-point"><title>{point.date}: {point.count} bookings</title></circle>)}
                                </svg>
                            </div>
                            <div className="admin-chart-labels">{trend.map((point) => <span key={point.date}>{new Date(`${point.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>)}</div>
                        </article>

                        <article className="admin-panel fleet-panel" id="fleet">
                            <div className="admin-panel-heading"><div><h2>Fleet availability</h2><p>Live vehicle status</p></div><Link to="/drivers">Manage fleet ↗</Link></div>
                            <div className="fleet-summary">
                                <div className="fleet-donut" style={{ background: fleetGradient }}><div><strong>{loading ? "—" : totalVehicles}</strong><span>total vehicles</span></div></div>
                                <div className="fleet-legend">
                                    <div><i className="busy"></i><span>On trip</span><strong>{loading ? "—" : busyVehicles}</strong></div>
                                    <div><i className="available"></i><span>Available</span><strong>{loading ? "—" : availableVehicles}</strong></div>
                                    <div><i className="offline"></i><span>Offline</span><strong>{loading ? "—" : offlineVehicles}</strong></div>
                                </div>
                            </div>
                            <div className="fleet-driver-summary"><span className="fleet-driver-icon">♧</span><div><strong>{loading ? "—" : dashboard.totalDrivers} registered drivers</strong><small>{dashboard.onlineVehicles} vehicles currently online · {dashboard.totalEmployees} employees</small></div><Link to="/drivers" aria-label="View drivers">›</Link></div>
                        </article>
                    </section>

                    <section className="admin-bottom-grid">
                        <article className="admin-panel bookings-panel" id="recent-bookings">
                            <div className="admin-panel-heading bookings-heading">
                                <div><h2>Recent bookings</h2><p>Employee and driver trip activity</p></div>
                                <div className="booking-toolbar">
                                    <button type="button" className="admin-secondary-button" onClick={exportBookings} disabled={!bookings.length}>↓ Export</button>
                                    <a className="admin-secondary-button" href="#recent-bookings">All bookings</a>
                                </div>
                            </div>
                            <div className="booking-tabs" role="tablist" aria-label="Filter bookings">
                                {[["ALL", "All bookings"], ["IN_PROGRESS", "In progress"], ["PENDING", "Pending"], ["COMPLETED", "Completed"]].map(([value, label]) => (
                                    <button key={value} type="button" role="tab" aria-selected={bookingFilter === value} onClick={() => setBookingFilter(value)}>
                                        {label}{value === "ALL" ? ` ${dashboard.totalBookings}` : value === "IN_PROGRESS" ? ` ${dashboard.tripsInProgress}` : value === "PENDING" ? ` ${dashboard.pendingRides}` : ""}
                                    </button>
                                ))}
                            </div>
                            <div className="admin-table-scroll">
                                <table className="admin-booking-table">
                                    <thead><tr><th>Booking / employee</th><th>Route</th><th>Driver / vehicle</th><th>Status</th><th>Fare</th></tr></thead>
                                    <tbody>
                                        {loading && <tr><td colSpan="5" className="admin-table-message">Loading ride and account data…</td></tr>}
                                        {!loading && !error && bookings.length === 0 && <tr><td colSpan="5" className="admin-table-message">No bookings match this filter.</td></tr>}
                                        {!loading && bookings.map((booking) => (
                                            <tr key={booking.id}>
                                                <td><strong>GC-{booking.id}</strong><span>{booking.employeeName || "Employee unavailable"}{booking.employeeId ? ` · ${booking.employeeId}` : ""}</span><small>{formatDate(booking.createdAt)}</small></td>
                                                <td><span className="route-value">{booking.pickupAddress || "Pickup not provided"}</span><small className="route-destination">↳ {booking.dropoffAddress || "Destination not provided"}</small></td>
                                                <td><strong>{booking.driverName || "Unassigned"}</strong><span>{[booking.vehicleModel, booking.vehicleRegistration].filter(Boolean).join(" · ") || (booking.driverId || "No vehicle assigned")}</span></td>
                                                <td><span className={`booking-status status-${String(booking.status || "").toLowerCase()}`}>{statusLabels[booking.status] || booking.status || "Unknown"}</span></td>
                                                <td>{booking.fare == null ? "—" : `₹${Number(booking.fare).toLocaleString("en-IN")}`}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="admin-table-footer">Showing {bookings.length} recent {bookings.length === 1 ? "booking" : "bookings"} · Data refreshes every 30 seconds</div>
                        </article>

                        <aside className="admin-operations-column">
                            <article className="admin-panel operations-panel">
                                <div className="admin-panel-heading"><div><h2>Operational alerts</h2></div><span className="alert-count">{Number(dashboard.pendingRides || 0) + offlineVehicles}</span></div>
                                {dashboard.pendingRides > 0 && <div className="operation-alert"><span className="operation-alert-icon red">!</span><div><strong>{dashboard.pendingRides} ride requests need a driver</strong><small>Review pending employee bookings.</small></div></div>}
                                {offlineVehicles > 0 && <div className="operation-alert"><span className="operation-alert-icon amber">◷</span><div><strong>{offlineVehicles} vehicles offline</strong><small>These vehicles are not available for dispatch.</small></div></div>}
                                {!dashboard.pendingRides && !offlineVehicles && <p className="no-operations-alerts">No outstanding ride or fleet alerts.</p>}
                                <Link className="operations-link" to="/drivers">Review drivers and fleet ↗</Link>
                            </article>
                            <article className="admin-panel people-panel">
                                <p className="eyebrow">ACCOUNT SUMMARY</p>
                                <h2>Accounts by role</h2>
                                <p>Registered GoCab accounts across all three roles.</p>
                                <div><span>Employees</span><strong>{loading ? "—" : dashboard.totalEmployees}</strong></div>
                                <div><span>Drivers</span><strong>{loading ? "—" : dashboard.totalDrivers}</strong></div>
                                <div><span>Admins</span><strong>{loading ? "—" : dashboard.totalAdmins}</strong></div>
                                <Link to="/drivers">Open driver directory ↗</Link>
                            </article>
                        </aside>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
