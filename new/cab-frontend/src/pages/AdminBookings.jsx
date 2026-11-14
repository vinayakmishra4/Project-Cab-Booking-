import { useEffect, useMemo, useState } from "react";
import AdminModal from "../components/AdminModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { downloadCsv, fetchRides, formatCurrency, formatDate, statusLabels } from "../services/adminService";

const pageSize = 10;

function AdminBookings() {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedRide, setSelectedRide] = useState(null);

    const loadRides = async () => {
        setLoading(true);
        try {
            setRides(await fetchRides());
            setError("");
        } catch {
            setError("Bookings could not be loaded. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRides(); }, []);

    const filteredRides = useMemo(() => {
        const query = search.trim().toLowerCase();
        return rides.filter((ride) => {
            const matchesStatus = filter === "ALL"
                || (filter === "IN_PROGRESS" ? ["ACCEPTED", "STARTED"].includes(ride.status) : ride.status === filter);
            const searchable = [
                ride.id, ride.employeeName, ride.employeeId, ride.employeeEmail, ride.pickupAddress,
                ride.dropoffAddress, ride.driverName, ride.driverId, ride.vehicleModel, ride.vehicleRegistration,
                ride.status, ride.createdAt
            ].join(" ").toLowerCase();
            return matchesStatus && (!query || searchable.includes(query));
        });
    }, [filter, rides, search]);

    const pageCount = Math.max(1, Math.ceil(filteredRides.length / pageSize));
    const visibleRides = filteredRides.slice((page - 1) * pageSize, page * pageSize);
    const tabs = [
        ["ALL", "All"],
        ["REQUESTED", "Pending"],
        ["IN_PROGRESS", "In progress"],
        ["COMPLETED", "Completed"]
    ];

    const exportRides = () => downloadCsv("mygocab-bookings.csv", [
        "Booking ID", "Employee", "Employee ID", "Pickup", "Drop", "Date and time",
        "Driver", "Vehicle model", "Registration", "Status", "Fare", "Distance (km)"
    ], filteredRides.map((ride) => [
        ride.id, ride.employeeName, ride.employeeId, ride.pickupAddress, ride.dropoffAddress,
        ride.createdAt, ride.driverName, ride.vehicleModel, ride.vehicleRegistration,
        statusLabels[ride.status] || ride.status, ride.fare, ride.distanceKm
    ]));

    return (
        <div className="admin-data-page">
            <AdminPageHeader title="Bookings" description="Search and review every booking in the system." actions={
                <button className="admin-refresh-button" type="button" onClick={loadRides} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
            } />
            <section className="admin-panel admin-list-panel">
                <div className="admin-list-toolbar">
                    <div className="booking-tabs" role="tablist" aria-label="Filter bookings">
                        {tabs.map(([value, label]) => (
                            <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => { setFilter(value); setPage(1); }}>{label}</button>
                        ))}
                    </div>
                    <div className="admin-list-controls">
                        <label className="admin-search"><span className="sr-only">Search bookings</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search bookings…" /></label>
                        <button className="admin-secondary-button" type="button" onClick={exportRides} disabled={!filteredRides.length}>↓ Export</button>
                    </div>
                </div>
                {error && <div className="admin-error-state" role="alert"><span>{error}</span><button type="button" onClick={loadRides}>Retry</button></div>}
                <div className="admin-table-scroll">
                    <table className="admin-booking-table admin-full-table">
                        <thead><tr><th>Booking</th><th>Employee</th><th>Pickup</th><th>Drop</th><th>Date / time</th><th>Driver / vehicle</th><th>Status</th><th>Fare</th><th>Distance</th></tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan="9" className="admin-table-message">Loading all bookings…</td></tr>}
                            {!loading && !error && !filteredRides.length && <tr><td colSpan="9" className="admin-table-message">{rides.length ? "No bookings match your filters." : "No bookings are available yet."}</td></tr>}
                            {!loading && !error && visibleRides.map((ride) => (
                                <tr key={ride.id} className="admin-clickable-row" tabIndex={0} onClick={() => setSelectedRide(ride)} onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        setSelectedRide(ride);
                                    }
                                }} aria-label={`View booking ${ride.id} details`}>
                                    <td><strong>GC-{ride.id}</strong></td>
                                    <td><strong>{ride.employeeName || "—"}</strong><small>{ride.employeeId || ride.employeeEmail || ""}</small></td>
                                    <td>{ride.pickupAddress || "—"}</td><td>{ride.dropoffAddress || "—"}</td>
                                    <td>{formatDate(ride.createdAt)}</td>
                                    <td><strong>{ride.driverName || "Unassigned"}</strong><small>{[ride.vehicleModel, ride.vehicleRegistration].filter(Boolean).join(" · ")}</small></td>
                                    <td><span className={`booking-status status-${String(ride.status || "").toLowerCase()}`}>{statusLabels[ride.status] || ride.status || "—"}</span></td>
                                    <td>{formatCurrency(ride.fare)}</td>
                                    <td>{ride.distanceKm == null ? "—" : `${ride.distanceKm} km`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <AdminPagination page={page} pageCount={pageCount} total={filteredRides.length} pageSize={pageSize} onPageChange={setPage} />
            </section>
            {selectedRide && <AdminModal title={`Booking GC-${selectedRide.id}`} onClose={() => setSelectedRide(null)} wide>
                <div className="admin-detail-grid">
                    {[
                        ["Employee", selectedRide.employeeName],
                        ["Employee ID", selectedRide.employeeId],
                        ["Employee email", selectedRide.employeeEmail],
                        ["Pickup", selectedRide.pickupAddress],
                        ["Pickup coordinates", selectedRide.pickupLat != null && selectedRide.pickupLng != null ? `${selectedRide.pickupLat}, ${selectedRide.pickupLng}` : null],
                        ["Drop", selectedRide.dropoffAddress],
                        ["Drop coordinates", selectedRide.dropLat != null && selectedRide.dropLng != null ? `${selectedRide.dropLat}, ${selectedRide.dropLng}` : null],
                        ["Booking date and time", formatDate(selectedRide.createdAt)],
                        ["Driver", selectedRide.driverName],
                        ["Driver ID", selectedRide.driverId],
                        ["Vehicle model", selectedRide.vehicleModel],
                        ["Registration", selectedRide.vehicleRegistration],
                        ["Status", statusLabels[selectedRide.status] || selectedRide.status],
                        ["Fare", formatCurrency(selectedRide.fare)],
                        ["Distance", selectedRide.distanceKm == null ? null : `${selectedRide.distanceKm} km`],
                        ["Duration", selectedRide.duration == null ? null : selectedRide.duration],
                        ["Start time", selectedRide.startedAt || selectedRide.startTime ? formatDate(selectedRide.startedAt || selectedRide.startTime) : null],
                        ["End time", selectedRide.endedAt || selectedRide.endTime ? formatDate(selectedRide.endedAt || selectedRide.endTime) : null]
                    ].filter(([, value]) => value != null && value !== "").map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
                </div>
            </AdminModal>}
        </div>
    );
}

export default AdminBookings;
