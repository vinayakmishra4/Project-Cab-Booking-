import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";

const pageSize = 10;

function AdminFleet() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const loadVehicles = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/admin/all-cabs");
            if (!Array.isArray(response.data)) throw new Error("Unexpected fleet response");
            setVehicles(response.data);
            setError("");
        } catch {
            setError("Fleet data could not be loaded. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadVehicles(); }, []);

    const filteredVehicles = useMemo(() => {
        const query = search.trim().toLowerCase();
        return vehicles.filter((vehicle) => [
            vehicle.model, vehicle.carNumber, vehicle.vehicleType, vehicle.driver?.name,
            vehicle.driver?.driverId, vehicle.driver?.email
        ].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [search, vehicles]);

    const pageCount = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
    const visibleVehicles = filteredVehicles.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="admin-data-page">
            <AdminPageHeader title="Fleet" description="Vehicle availability, registration and assigned driver." actions={<button className="admin-refresh-button" type="button" disabled={loading} onClick={loadVehicles}>{loading ? "Loading…" : "↻ Refresh"}</button>} />
            <section className="admin-panel admin-list-panel">
                <div className="admin-list-toolbar">
                    <p className="admin-result-count">{loading ? "Loading fleet…" : `${filteredVehicles.length} vehicles`}</p>
                    <label className="admin-search"><span className="sr-only">Search fleet</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search vehicle or driver…" /></label>
                </div>
                {error && <div className="admin-error-state" role="alert"><span>{error}</span><button type="button" onClick={loadVehicles}>Retry</button></div>}
                <div className="admin-table-scroll">
                    <table className="admin-booking-table admin-full-table">
                        <thead><tr><th>Vehicle</th><th>Registration</th><th>Type</th><th>Driver</th><th>Availability</th><th>Online</th></tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan="6" className="admin-table-message">Loading vehicle records…</td></tr>}
                            {!loading && !error && !filteredVehicles.length && <tr><td colSpan="6" className="admin-table-message">{vehicles.length ? "No vehicles match your search." : "No vehicles are registered yet."}</td></tr>}
                            {!loading && !error && visibleVehicles.map((vehicle) => <tr key={vehicle.id}>
                                <td><strong>{vehicle.model || "—"}</strong></td><td>{vehicle.carNumber || "—"}</td><td>{vehicle.vehicleType || "—"}</td>
                                <td><strong>{vehicle.driver?.name || "Unassigned"}</strong><small>{vehicle.driver?.driverId || vehicle.driver?.email || ""}</small></td>
                                <td>{!vehicle.online ? "Offline" : vehicle.available ? "Available" : "On trip"}</td><td>{vehicle.online ? "Online" : "Offline"}</td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
                <AdminPagination page={page} pageCount={pageCount} total={filteredVehicles.length} pageSize={pageSize} onPageChange={setPage} />
            </section>
        </div>
    );
}

export default AdminFleet;
