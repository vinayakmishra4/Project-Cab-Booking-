import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import AdminModal from "../components/AdminModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { fetchAccounts, fetchRides } from "../services/adminService";

const pageSize = 10;

function AdminEmployees() {
    const [employees, setEmployees] = useState([]);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const [accountGroups, rideRows] = await Promise.all([fetchAccounts(), fetchRides()]);
            setEmployees(accountGroups.employees);
            setRides(rideRows);
            setError("");
        } catch {
            setError("Employee data could not be loaded. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const deleteEmployee = async () => {
        if (!employeeToDelete) return;
        setDeleting(true);
        setDeleteError("");
        const endpoint = employeeToDelete.source === "legacy"
            ? `/api/admin/employees/legacy/${employeeToDelete.id}`
            : `/api/admin/employees/${employeeToDelete.id}`;
        try {
            await api.delete(endpoint);
            setEmployees((current) => current.filter((employee) => (
                employee.id !== employeeToDelete.id || employee.source !== employeeToDelete.source
            )));
            setEmployeeToDelete(null);
        } catch {
            setDeleteError("Employee could not be deleted. Refresh the list and try again.");
        } finally {
            setDeleting(false);
        }
    };

    const employeeRows = useMemo(() => {
        const normalizedRides = new Map();
        rides.forEach((ride) => {
            const email = String(ride.employeeEmail || "").toLowerCase();
            const employeeId = String(ride.employeeId || "").toLowerCase();
            const key = email || employeeId;
            if (key) normalizedRides.set(key, (normalizedRides.get(key) || 0) + 1);
        });
        const query = search.trim().toLowerCase();
        return employees.map((employee) => {
            const email = String(employee.email || "").toLowerCase();
            const employeeId = String(employee.employeeId || "").toLowerCase();
            return {
                ...employee,
                totalBookings: normalizedRides.get(email) || normalizedRides.get(employeeId) || 0
            };
        }).filter((employee) => [employee.name, employee.employeeId, employee.email, employee.phone]
            .some((value) => String(value || "").toLowerCase().includes(query)));
    }, [employees, rides, search]);

    const pageCount = Math.max(1, Math.ceil(employeeRows.length / pageSize));
    const visibleEmployees = employeeRows.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="admin-data-page">
            <AdminPageHeader title="Employees" description="Employee directory with booking totals derived from ride records." actions={<button className="btn btn-outline-primary admin-refresh-button" type="button" disabled={loading} onClick={loadData}>{loading ? "Loading…" : "↻ Refresh"}</button>} />
            <section className="admin-panel admin-list-panel">
                <div className="admin-list-toolbar">
                    <p className="admin-result-count">{loading ? "Loading employees…" : `${employeeRows.length} employees`}</p>
                    <label className="admin-search"><span className="sr-only">Search employees</span><input className="form-control" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, ID, email or phone…" /></label>
                </div>
                {error && <div className="admin-error-state" role="alert"><span>{error}</span><button className="btn btn-primary" type="button" onClick={loadData}>Retry</button></div>}
                <div className="admin-table-scroll">
                    <table className="table admin-booking-table admin-full-table">
                        <thead><tr><th>Name</th><th>Employee ID</th><th>Email</th><th>Phone</th><th>Total bookings</th><th>Actions</th></tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan="6" className="admin-table-message">Loading employee records…</td></tr>}
                            {!loading && !error && !employeeRows.length && <tr><td colSpan="6" className="admin-table-message">{employees.length ? "No employees match your search." : "No employees are registered yet."}</td></tr>}
                            {!loading && !error && visibleEmployees.map((employee) => <tr key={`${employee.source || "employee"}-${employee.id || employee.email}`}>
                                <td><strong>{employee.name || "—"}</strong></td><td>{employee.employeeId || "—"}</td><td>{employee.email || "—"}</td><td>{employee.phone || "—"}</td><td>{employee.totalBookings.toLocaleString("en-IN")}</td>
                                <td><button className="btn btn-outline-danger admin-danger-button" type="button" onClick={() => { setEmployeeToDelete(employee); setDeleteError(""); }}>Delete</button></td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
                <p className="admin-table-footer">Joined date and account status are not stored for employee records.</p>
                <AdminPagination page={page} pageCount={pageCount} total={employeeRows.length} pageSize={pageSize} onPageChange={setPage} />
            </section>
            {employeeToDelete && <AdminModal title="Delete employee?" onClose={() => {
                if (!deleting) {
                    setEmployeeToDelete(null);
                    setDeleteError("");
                }
            }}>
                <div className="admin-delete-confirm">
                    <p><strong>{employeeToDelete.name || employeeToDelete.email}</strong> and all linked booking and billing history will be permanently deleted. This cannot be undone.</p>
                    {deleteError && <p className="admin-error-text" role="alert">{deleteError}</p>}
                    <div className="admin-modal-actions">
                        <button className="btn btn-outline-secondary admin-secondary-button" type="button" disabled={deleting} onClick={() => setEmployeeToDelete(null)}>Cancel</button>
                        <button className="btn btn-danger admin-danger-button" type="button" disabled={deleting} onClick={deleteEmployee}>{deleting ? "Deleting…" : "Delete employee and records"}</button>
                    </div>
                </div>
            </AdminModal>}
        </div>
    );
}

export default AdminEmployees;
