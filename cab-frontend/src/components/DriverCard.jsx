
function DriverCard({ driver }) {
    const cab = driver.cab;

    const availability = !driver.enabled
        ? "Account disabled"
        : !cab?.online
            ? "Offline"
            : cab.available
                ? "Online · Available"
                : "Online · On trip";

    const statusClass = !driver.enabled
        ? "text-bg-danger"
        : !cab?.online
            ? "text-bg-secondary"
            : cab.available
                ? "text-bg-success"
                : "text-bg-warning";

    return (
        <div
            className="card shadow-sm mt-3"
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                color: "var(--text)"
            }}
        >
            <div className="card-body">

                <h5 className="card-title fw-bold mb-3">
                    🚗 Driver Assigned
                </h5>

                <div className="mb-2">
                    <span className="fw-semibold">Name: </span>
                    {driver.name}
                </div>

                <div className="mb-2">
                    <span className="fw-semibold">Driver ID: </span>
                    {driver.driverId || "—"}
                </div>

                <div className="mb-2">
                    <span className="fw-semibold">Email: </span>
                    {driver.email || "—"}
                </div>

                <div className="mb-2">
                    <span className="fw-semibold">Phone: </span>
                    {driver.phone || "—"}
                </div>

                <div className="mb-3">
                    <span className="fw-semibold">Vehicle: </span>
                    {cab
                        ? `${cab.model || "Vehicle"} · ${cab.carNumber || "No registration"}`
                        : "No vehicle assigned"}
                </div>

                <div>
                    <span className="fw-semibold me-2">Status:</span>
                    <span className={`badge ${statusClass}`}>
                        {availability}
                    </span>
                </div>

            </div>
        </div>
    );
}

export default DriverCard;
