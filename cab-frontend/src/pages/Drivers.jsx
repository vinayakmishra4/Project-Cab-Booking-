import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AdminModal from "../components/AdminModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";

const pageSize = 10;

function Drivers() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [driverToDelete, setDriverToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const [usersResponse, cabsResponse] = await Promise.all([
                api.get("/api/admin/all-users"),
                api.get("/api/admin/all-cabs")
            ]);
            if (!Array.isArray(usersResponse.data) || !Array.isArray(cabsResponse.data)) {
                throw new Error("Unexpected driver response");
            }
            const cabsByDriverId = new Map(cabsResponse.data.map((cab) => [cab.driver?.id, cab]));
            setDrivers(usersResponse.data
                .filter((user) => user.role === "DRIVER")
                .map((driver) => ({ ...driver, cab: cabsByDriverId.get(driver.id) || null })));
            setError("");
        } catch {
            setError("Driver data could not be loaded. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDrivers(); }, []);

    const deleteDriver = async () => {
        if (!driverToDelete) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await api.delete(`/api/admin/drivers/${driverToDelete.id}`);
            setDrivers((current) => current.filter((driver) => driver.id !== driverToDelete.id));
            setDriverToDelete(null);
        } catch {
            setDeleteError("Driver could not be deleted. Refresh the list and try again.");
        } finally {
            setDeleting(false);
        }
    };

    const filteredDrivers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return drivers.filter((driver) => [
            driver.name, driver.driverId, driver.email, driver.phone, driver.cab?.model,
            driver.cab?.carNumber
        ].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [drivers, search]);

    const pageCount = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
    const visibleDrivers = filteredDrivers.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="admin-data-page">
            <AdminPageHeader title="Drivers" description="Driver directory and assigned vehicle status." actions={<>
                <button className="admin-refresh-button" type="button" disabled={loading} onClick={loadDrivers}>{loading ? "Loading…" : "↻ Refresh"}</button>
            </>} />
            <section className="admin-panel admin-list-panel">
                <div className="admin-list-toolbar">
                    <p className="admin-result-count">{loading ? "Loading drivers…" : `${filteredDrivers.length} drivers`}</p>
                    <label className="admin-search"><span className="sr-only">Search drivers</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, driver ID, email or vehicle…" /></label>
                </div>
                {error && <div className="admin-error-state" role="alert"><span>{error}</span><button type="button" onClick={loadDrivers}>Retry</button></div>}
                <div className="admin-table-scroll">
                    <table className="admin-booking-table admin-full-table">
                        <thead><tr><th>Driver</th><th>Driver ID</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan="7" className="admin-table-message">Loading driver records…</td></tr>}
                            {!loading && !error && !filteredDrivers.length && <tr><td colSpan="7" className="admin-table-message">{drivers.length ? "No drivers match your search." : "No drivers are registered yet."}</td></tr>}
                            {!loading && !error && visibleDrivers.map((driver) => {
                                const status = !driver.enabled ? "Disabled" : !driver.cab?.online ? "Offline" : driver.cab.available ? "Available" : "On trip";
                                return <tr key={driver.id}>
                                    <td><strong>{driver.name || "—"}</strong></td><td>{driver.driverId || "—"}</td><td>{driver.email || "—"}</td><td>{driver.phone || "—"}</td>
                                    <td><strong>{driver.cab?.model || "No vehicle assigned"}</strong><small>{driver.cab?.carNumber || ""}</small></td><td>{status}</td>
                                    <td><button className="admin-danger-button" type="button" onClick={() => { setDriverToDelete(driver); setDeleteError(""); }}>Delete</button></td>
                                </tr>;
                            })}
                        </tbody>
                    </table>
                </div>
                <AdminPagination page={page} pageCount={pageCount} total={filteredDrivers.length} pageSize={pageSize} onPageChange={setPage} />
            </section>
            {driverToDelete && <AdminModal title="Delete driver?" onClose={() => {
                if (!deleting) {
                    setDriverToDelete(null);
                    setDeleteError("");
                }
            }}>
                <div className="admin-delete-confirm">
                    <p><strong>{driverToDelete.name || driverToDelete.email}</strong>, assigned vehicle(s), and all linked booking and billing history will be permanently deleted. This cannot be undone.</p>
                    {deleteError && <p className="admin-error-text" role="alert">{deleteError}</p>}
                    <div className="admin-modal-actions">
                        <button className="admin-secondary-button" type="button" disabled={deleting} onClick={() => setDriverToDelete(null)}>Cancel</button>
                        <button className="admin-danger-button" type="button" disabled={deleting} onClick={deleteDriver}>{deleting ? "Deleting…" : "Delete driver and records"}</button>
                    </div>
                </div>
            </AdminModal>}
        </div>
    );
}

export default Drivers;
