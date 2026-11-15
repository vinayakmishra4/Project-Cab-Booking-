import { useEffect, useMemo, useState } from "react";
import AdminModal from "../components/AdminModal";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPagination from "../components/AdminPagination";
import { downloadCsv, fetchRides, formatCurrency, formatDate } from "../services/adminService";

const pageSize = 10;

function AdminBilling() {
    const [rides, setRides] = useState([]);
    const [manualCharges, setManualCharges] = useState({});
    const [chargesLoaded, setChargesLoaded] = useState(false);
    const [chargeStorageError, setChargeStorageError] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [page, setPage] = useState(1);
    const [selectedRide, setSelectedRide] = useState(null);
    const [chargeDescription, setChargeDescription] = useState("");
    const [chargeAmount, setChargeAmount] = useState("");
    const [chargeError, setChargeError] = useState("");
    const storageKey = `mygocab-billing-charges:${localStorage.getItem("userEmail") || "admin"}`;

    const loadRides = async () => {
        setLoading(true);
        try {
            setRides(await fetchRides());
            setError("");
        } catch {
            setError("Billing data could not be loaded. Check the backend connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRides(); }, []);

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
                    || Object.values(parsed).some((charges) => !Array.isArray(charges)
                        || charges.some((charge) => typeof charge.description !== "string"
                            || !Number.isFinite(Number(charge.amount))))) {
                    throw new Error("Stored billing adjustments are invalid");
                }
                setManualCharges(parsed);
            }
        } catch {
            setChargeStorageError("Temporary billing adjustments could not be restored from this browser session.");
        } finally {
            setChargesLoaded(true);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!chargesLoaded) return;
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(manualCharges));
        } catch {
            setChargeStorageError("Temporary billing adjustments could not be saved in this browser session.");
        }
    }, [chargesLoaded, manualCharges, storageKey]);

    const billRows = useMemo(() => rides
        .filter((ride) => ride.status === "COMPLETED")
        .map((ride) => {
            const fareValue = ride.fare ?? ride.billing?.fare;
            const fare = fareValue == null || !Number.isFinite(Number(fareValue)) ? null : Number(fareValue);
            const gstValue = ride.billing?.gstAmount;
            const charges = [];
            if (gstValue != null && Number.isFinite(Number(gstValue))) {
                charges.push({ description: `GST${ride.billing?.gstPercentage != null ? ` (${ride.billing.gstPercentage}%)` : ""}`, amount: Number(gstValue) });
            }
            (manualCharges[ride.id] || []).forEach((charge) => charges.push(charge));
            const total = fare == null ? null : fare + charges.reduce((sum, charge) => sum + charge.amount, 0);
            return { ...ride, fare, charges, total };
        })
        .filter((ride) => {
            const parsedDate = ride.createdAt ? new Date(ride.createdAt) : null;
            const date = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : "";
            return (!fromDate || (date && date >= fromDate)) && (!toDate || (date && date <= toDate));
        }), [fromDate, manualCharges, rides, toDate]);

    const knownFareRows = billRows.filter((ride) => ride.fare != null);
    const totalCost = knownFareRows.reduce((sum, ride) => sum + (ride.total ?? 0), 0);
    const totalFare = knownFareRows.reduce((sum, ride) => sum + ride.fare, 0);
    const totalExtraCharges = knownFareRows.reduce((sum, ride) => (
        sum + ride.charges.reduce((chargeSum, charge) => chargeSum + charge.amount, 0)
    ), 0);
    const averageFare = knownFareRows.length
        ? knownFareRows.reduce((sum, ride) => sum + ride.fare, 0) / knownFareRows.length
        : null;
    const pageCount = Math.max(1, Math.ceil(billRows.length / pageSize));
    const visibleRows = billRows.slice((page - 1) * pageSize, page * pageSize);

    const addCharge = (event) => {
        event.preventDefault();
        const amount = Number(chargeAmount);
        if (!chargeDescription.trim() || !Number.isFinite(amount) || amount === 0) {
            setChargeError("Enter a description and a non-zero valid amount. Use a negative amount for a discount.");
            return;
        }
        setManualCharges((current) => ({
            ...current,
            [selectedRide.id]: [...(current[selectedRide.id] || []), { description: chargeDescription.trim(), amount }]
        }));
        setChargeDescription("");
        setChargeAmount("");
        setChargeError("");
        setSelectedRide(null);
    };

    const exportBilling = () => downloadCsv("mygocab-billing.csv", [
        "Booking ID", "Date", "Employee", "Driver", "Vehicle", "Route", "Fare", "Extra charges", "Total"
    ], billRows.map((ride) => [
        ride.id, ride.createdAt, ride.employeeName, ride.driverName,
        [ride.vehicleModel, ride.vehicleRegistration].filter(Boolean).join(" "),
        `${ride.pickupAddress || ""} to ${ride.dropoffAddress || ""}`,
        ride.fare, ride.charges.map((charge) => `${charge.description}: ${charge.amount}`).join("; "), ride.total
    ]));

    return (
        <div className="admin-data-page">
            <AdminPageHeader title="Billing" description="Completed bookings, fare and applicable extra charges." actions={<button className="admin-refresh-button" type="button" onClick={loadRides} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>} />
            <div className="admin-summary-grid">
                <article className="admin-panel admin-summary-card"><span>Total cost</span><strong>{loading ? "—" : formatCurrency(totalCost)}</strong><small>Fare plus charges for the selected period</small></article>
                <article className="admin-panel admin-summary-card"><span>Trips billed</span><strong>{loading ? "—" : billRows.length.toLocaleString("en-IN")}</strong><small>Completed bookings in the selected period</small></article>
                <article className="admin-panel admin-summary-card"><span>Average fare per trip</span><strong>{loading ? "—" : formatCurrency(averageFare)}</strong><small>Based on completed trips with a recorded fare</small></article>
            </div>
            <section className="admin-panel admin-list-panel">
                <div className="admin-list-toolbar admin-billing-toolbar">
                    <div className="admin-date-filters">
                        <label>From <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} /></label>
                        <label>To <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); setPage(1); }} /></label>
                        {(fromDate || toDate) && <button className="admin-text-button" type="button" onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}>All time</button>}
                    </div>
                    <button className="admin-secondary-button" type="button" onClick={exportBilling} disabled={!billRows.length}>↓ Export CSV</button>
                </div>
                <p className="admin-session-note">Manual charges remain in this browser tab’s session only and are not saved to the backend. GST is included when present in the booking’s billing record.</p>
                {chargeStorageError && <p className="admin-error-text" role="alert">{chargeStorageError}</p>}
                {error && <div className="admin-error-state" role="alert"><span>{error}</span><button type="button" onClick={loadRides}>Retry</button></div>}
                <div className="admin-table-scroll">
                    <table className="admin-booking-table admin-full-table admin-billing-table">
                        <thead><tr><th>Booking / date</th><th>Employee</th><th>Driver / vehicle</th><th>Route</th><th>Fare</th><th>Extra charges</th><th>Total</th><th></th></tr></thead>
                        <tbody>
                            {loading && <tr><td colSpan="8" className="admin-table-message">Loading billing records…</td></tr>}
                            {!loading && !error && !billRows.length && <tr><td colSpan="8" className="admin-table-message">{rides.some((ride) => ride.status === "COMPLETED") ? "No completed bookings in this date range." : "No completed bookings are available yet."}</td></tr>}
                            {!loading && !error && visibleRows.map((ride) => <tr key={ride.id}>
                                <td><strong>GC-{ride.id}</strong><small>{formatDate(ride.createdAt)}</small></td>
                                <td><strong>{ride.employeeName || "—"}</strong><small>{ride.employeeId || ""}</small></td>
                                <td><strong>{ride.driverName || "Unassigned"}</strong><small>{[ride.vehicleModel, ride.vehicleRegistration].filter(Boolean).join(" · ")}</small></td>
                                <td><strong>{ride.pickupAddress || "—"}</strong><small>↳ {ride.dropoffAddress || "—"}</small></td>
                                <td>{formatCurrency(ride.fare)}</td>
                                <td>{ride.charges.length ? ride.charges.map((charge, index) => <small className="admin-charge-line" key={`${charge.description}-${index}`}>{charge.description}: {formatCurrency(charge.amount)}</small>) : "—"}</td>
                                <td><strong>{formatCurrency(ride.total)}</strong></td>
                                <td><button className="admin-secondary-button" type="button" disabled={ride.fare == null} title={ride.fare == null ? "A fare must be present to calculate a total" : undefined} onClick={() => { setSelectedRide(ride); setChargeError(""); }}>Add charge</button></td>
                            </tr>)}
                        </tbody>
                        {!loading && !error && billRows.length > 0 && <tfoot><tr><th colSpan="4">Totals</th><th>{formatCurrency(totalFare)}</th><th>{formatCurrency(totalExtraCharges)}</th><th>{formatCurrency(totalCost)}</th><th></th></tr></tfoot>}
                    </table>
                </div>
                <AdminPagination page={page} pageCount={pageCount} total={billRows.length} pageSize={pageSize} onPageChange={setPage} />
            </section>
            {selectedRide && <AdminModal title={`Add a charge to GC-${selectedRide.id}`} onClose={() => setSelectedRide(null)}>
                <form className="admin-charge-form" onSubmit={addCharge}>
                    <p>Changes apply immediately to this billing table only. Use a negative amount for a discount.</p>
                    <label>Description<input value={chargeDescription} onChange={(event) => setChargeDescription(event.target.value)} placeholder="Toll, waiting charge, discount…" required /></label>
                    <label>Amount (₹)<input type="number" step="0.01" value={chargeAmount} onChange={(event) => setChargeAmount(event.target.value)} required /></label>
                    {chargeError && <p className="admin-error-text" role="alert">{chargeError}</p>}
                    <div className="admin-modal-actions"><button type="button" className="admin-secondary-button" onClick={() => setSelectedRide(null)}>Cancel</button><button type="submit">Add charge</button></div>
                </form>
            </AdminModal>}
        </div>
    );
}

export default AdminBilling;
