import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { fetchAccounts, formatCurrency, formatDate, statusLabels } from "../services/adminService";
import AdminModal from "../components/AdminModal";

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

function AdminDashboard() {
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [bookingFilter, setBookingFilter] = useState("ALL");
    const [accountDialog, setAccountDialog] = useState(false);
    const [accounts, setAccounts] = useState(null);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsError, setAccountsError] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/admin/dashboard");
            setDashboard({ ...emptyDashboard, ...response.data });
            setError("");
        } catch {
            setError("Dashboard data could not be loaded. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const recentBookings = useMemo(
        () => Array.isArray(dashboard.recentBookings) ? dashboard.recentBookings.slice(0, 5) : [],
        [dashboard.recentBookings]
    );
    const filteredBookings = useMemo(() => {
        if (bookingFilter === "IN_PROGRESS") {
            return recentBookings.filter((booking) => ["ACCEPTED", "STARTED"].includes(booking.status));
        }
        if (bookingFilter === "PENDING") return recentBookings.filter((booking) => booking.status === "REQUESTED");
        if (bookingFilter === "COMPLETED") return recentBookings.filter((booking) => booking.status === "COMPLETED");
        return recentBookings;
    }, [bookingFilter, recentBookings]);

    const trend = Array.isArray(dashboard.bookingTrend) ? dashboard.bookingTrend : [];
    const trendTotal = trend.reduce((total, point) => total + Number(point.count || 0), 0);
    const maxTrend = Math.max(1, ...trend.map((point) => Number(point.count || 0)));
    const chartPoints = trend.map((point, index) => ({
        ...point,
        x: trend.length < 2 ? 320 : 24 + index * (592 / (trend.length - 1)),
        y: 152 - (Number(point.count || 0) / maxTrend) * 112
    }));
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

    const openAccounts = async () => {
        setAccountDialog(true);
        if (accounts || accountsLoading) return;
        setAccountsLoading(true);
        setAccountsError("");
        try {
            setAccounts(await fetchAccounts());
        } catch {
            setAccountsError("Account data could not be loaded. Check the backend connection and try again.");
        } finally {
            setAccountsLoading(false);
        }
    };

    const tabs = [
        ["ALL", "All bookings", Number(dashboard.totalBookings || 0)],
        ["IN_PROGRESS", "In progress", Number(dashboard.tripsInProgress || 0)],
        ["PENDING", "Pending", Number(dashboard.pendingRides || 0)],
        ["COMPLETED", "Completed", Number(dashboard.completedTrips || 0)]
    ];

    return (
        <div className="admin-overview">
            <section className="admin-welcome">
                <div>
                    <p className="eyebrow">LIVE TRANSPORT MANAGEMENT</p>
                    <h1>Transport overview <span className="admin-live-pill">LIVE</span></h1>
                    <p>A clear view of employee travel, drivers, and fleet activity.</p>
                </div>
                <button className="admin-refresh-button" type="button" onClick={loadDashboard} disabled={loading}>
                    {loading ? "Refreshing…" : "↻ Refresh data"}
                </button>
            </section>

            {error && <div className="admin-error-state" role="alert"><span>{error}</span><button type="button" onClick={loadDashboard}>Retry</button></div>}

            <section className="admin-stat-grid" aria-label="Transport statistics">
                <article className="admin-stat-card"><span className="admin-stat-icon">▤</span><p>Total bookings</p><strong>{loading ? "—" : Number(dashboard.totalBookings || 0).toLocaleString("en-IN")}</strong><small>All employee and legacy-user rides</small></article>
                <article className="admin-stat-card"><span className="admin-stat-icon green">✓</span><p>Trips completed</p><strong>{loading ? "—" : Number(dashboard.completedTrips || 0).toLocaleString("en-IN")}</strong><small>Successfully completed rides</small></article>
                <article className="admin-stat-card"><span className="admin-stat-icon amber">◎</span><p>Trips in progress</p><strong>{loading ? "—" : Number(dashboard.tripsInProgress || 0).toLocaleString("en-IN")}</strong><small>Accepted or started trips</small></article>
                <button type="button" className="admin-stat-card admin-stat-action" onClick={openAccounts} aria-haspopup="dialog">
                    <span className="admin-stat-icon slate">♙</span><p>Registered accounts</p>
                    <strong>{loading ? "—" : (Number(dashboard.totalEmployees || 0) + Number(dashboard.totalDrivers || 0) + Number(dashboard.totalAdmins || 0)).toLocaleString("en-IN")}</strong>
                    <small>{dashboard.totalEmployees || 0} employees · {dashboard.totalDrivers || 0} drivers · {dashboard.totalAdmins || 0} admins</small>
                </button>
            </section>

            <section className="admin-middle-grid">
                <article className="admin-panel trend-panel" id="booking-trends">
                    <div className="admin-panel-heading">
                        <div><h2>Booking trends</h2><p><strong>{loading ? "—" : trendTotal.toLocaleString("en-IN")}</strong> bookings <span>over the last 7 days</span></p></div>
                        <span className="trend-legend"><i></i> Daily bookings</span>
                    </div>
                    {loading ? <p className="admin-panel-state">Loading booking trends…</p> : error ? <p className="admin-panel-state">Trend data is unavailable.</p> : trend.length === 0 ? <p className="admin-panel-state">No booking trend data available.</p> : (
                        <>
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
                            <div className="admin-chart-labels">{trend.map((point) => <span key={point.date}>{new Date(`${point.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}</span>)}</div>
                        </>
                    )}
                </article>

                <article className="admin-panel fleet-panel">
                    <div className="admin-panel-heading"><div><h2>Fleet availability</h2><p>Live vehicle status</p></div><Link to="/admin/fleet">Manage fleet ↗</Link></div>
                    <div className="fleet-summary">
                        <div className="fleet-donut" style={{ background: fleetGradient }}><div><strong>{loading ? "—" : totalVehicles}</strong><span>total vehicles</span></div></div>
                        <div className="fleet-legend">
                            <div><i className="busy"></i><span>On trip</span><strong>{loading ? "—" : busyVehicles}</strong></div>
                            <div><i className="available"></i><span>Available</span><strong>{loading ? "—" : availableVehicles}</strong></div>
                            <div><i className="offline"></i><span>Offline</span><strong>{loading ? "—" : offlineVehicles}</strong></div>
                        </div>
                    </div>
                    <div className="fleet-driver-summary"><span className="fleet-driver-icon">♧</span><div><strong>{loading ? "—" : dashboard.totalDrivers} registered drivers</strong><small>{dashboard.onlineVehicles || 0} vehicles currently online · {dashboard.totalEmployees || 0} employees</small></div><Link to="/admin/fleet" aria-label="View fleet">›</Link></div>
                </article>
            </section>

            <section className="admin-bottom-grid">
                <article className="admin-panel bookings-panel">
                    <div className="admin-panel-heading bookings-heading">
                        <div><h2>Recent bookings</h2><p>Latest employee and driver trip activity</p></div>
                        <div className="booking-toolbar"><Link className="admin-secondary-button" to="/admin/bookings">All bookings</Link></div>
                    </div>
                    <div className="booking-tabs" role="tablist" aria-label="Filter recent bookings">
                        {tabs.map(([value, label, count]) => (
                            <button key={value} type="button" role="tab" aria-selected={bookingFilter === value} onClick={() => setBookingFilter(value)}>
                                {label}{value === "ALL" || value === "IN_PROGRESS" || value === "PENDING" ? ` ${count}` : ""}
                            </button>
                        ))}
                    </div>
                    <div className="admin-table-scroll">
                        <table className="admin-booking-table">
                            <thead><tr><th>Booking / employee</th><th>Route</th><th>Driver / vehicle</th><th>Status</th><th>Fare</th></tr></thead>
                            <tbody>
                                {loading && <tr><td colSpan="5" className="admin-table-message">Loading ride and account data…</td></tr>}
                                {!loading && !error && filteredBookings.length === 0 && <tr><td colSpan="5" className="admin-table-message">{recentBookings.length ? "No recent bookings match this filter." : "No bookings available yet."}</td></tr>}
                                {!loading && !error && filteredBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td><strong>GC-{booking.id}</strong><span>{booking.employeeName || "Employee unavailable"}{booking.employeeId ? ` · ${booking.employeeId}` : ""}</span><small>{formatDate(booking.createdAt)}</small></td>
                                        <td><span className="route-value">{booking.pickupAddress || "Pickup not provided"}</span><small className="route-destination">↳ {booking.dropoffAddress || "Destination not provided"}</small></td>
                                        <td><strong>{booking.driverName || "Unassigned"}</strong><span>{[booking.vehicleModel, booking.vehicleRegistration].filter(Boolean).join(" · ") || (booking.driverId || "No vehicle assigned")}</span></td>
                                        <td><span className={`booking-status status-${String(booking.status || "").toLowerCase()}`}>{statusLabels[booking.status] || booking.status || "Unknown"}</span></td>
                                        <td>{formatCurrency(booking.fare)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="admin-table-footer">Showing up to {filteredBookings.length} of the latest {recentBookings.length} bookings</div>
                </article>

                <aside className="admin-operations-column">
                    <article className="admin-panel operations-panel">
                        <div className="admin-panel-heading"><div><h2>Operational alerts</h2></div><span className="alert-count">{Number(dashboard.pendingRides || 0) + offlineVehicles}</span></div>
                        {loading ? <p className="admin-panel-state">Loading operational alerts…</p> : (
                            <>
                                {dashboard.pendingRides > 0 && <div className="operation-alert"><span className="operation-alert-icon red">!</span><div><strong>{dashboard.pendingRides} ride requests need a driver</strong><small>Review pending employee bookings.</small></div></div>}
                                {offlineVehicles > 0 && <div className="operation-alert"><span className="operation-alert-icon amber">◷</span><div><strong>{offlineVehicles} vehicles offline</strong><small>These vehicles are not available for dispatch.</small></div></div>}
                                {!dashboard.pendingRides && !offlineVehicles && <p className="no-operations-alerts">No outstanding ride or fleet alerts.</p>}
                            </>
                        )}
                        <Link className="operations-link" to="/admin/drivers">Review drivers and fleet ↗</Link>
                    </article>
                    <article className="admin-panel people-panel">
                        <p className="eyebrow">ACCOUNT SUMMARY</p>
                        <h2>Accounts by role</h2>
                        <p>Registered GoCab accounts across all three roles.</p>
                        <div><span>Employees</span><strong>{loading ? "—" : dashboard.totalEmployees}</strong></div>
                        <div><span>Drivers</span><strong>{loading ? "—" : dashboard.totalDrivers}</strong></div>
                        <div><span>Admins</span><strong>{loading ? "—" : dashboard.totalAdmins}</strong></div>
                        <Link to="/admin/drivers">Open driver directory ↗</Link>
                    </article>
                </aside>
            </section>

            {accountDialog && (
                <AdminModal title="Registered accounts" onClose={() => setAccountDialog(false)} wide>
                    <div className="admin-account-summary">
                        <p>Accounts grouped by role. Status is shown where the account data provides it.</p>
                        {accountsLoading && <p role="status">Loading account records…</p>}
                        {accountsError && <p className="admin-error-text" role="alert">{accountsError}<button type="button" className="admin-text-button" onClick={openAccounts}>Retry</button></p>}
                        {accounts && [["Employees", accounts.employees, "/admin/employees"], ["Drivers", accounts.drivers, "/admin/drivers"], ["Admins", accounts.admins, null]].map(([label, people, href]) => (
                            <section className="admin-account-group" key={label}>
                                <div className="admin-account-group-heading"><h3>{label}</h3><strong>{people.length}</strong></div>
                                {people.length === 0 ? <p className="admin-panel-state">No {label.toLowerCase()} are registered.</p> : (
                                    <ul>
                                        {people.slice(0, 5).map((person) => (
                                            <li key={`${label}-${person.id || person.email}`}>
                                                <span><strong>{person.name || "Name unavailable"}</strong><small>{person.email || "Email unavailable"}</small></span>
                                                {typeof person.enabled === "boolean" && <em className={person.enabled ? "account-active" : "account-disabled"}>{person.enabled ? "Active" : "Disabled"}</em>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {href && <Link to={href} onClick={() => setAccountDialog(false)}>View all {label.toLowerCase()} ↗</Link>}
                            </section>
                        ))}
                    </div>
                </AdminModal>
            )}
        </div>
    );
}

export default AdminDashboard;
