function DriverCard({ driver }) {
    const cab = driver.cab;
    const availability = !driver.enabled
        ? "Account disabled"
        : !cab?.online
            ? "Offline"
            : cab.available
                ? "Online · Available"
                : "Online · On trip";

    return (

        <div style={{
            background:"var(--surface)",
            border:"1px solid var(--border)",
            padding:"18px",
            marginTop:"15px",
            "border-Radius":"12px",
            color:"var(--text)",
            boxShadow:"var(--shadow)"
        }}>

            <h3 style={{marginBottom:"10px"}}>
                🚗 Driver Assigned
            </h3>

            <p>
                <b>Name:</b> {driver.name}
            </p>

            <p>
                <b>Driver ID:</b> {driver.driverId || "—"}
            </p>

            <p>
                <b>Email:</b> {driver.email || "—"}
            </p>

            <p>
                <b>Phone:</b> {driver.phone || "—"}
            </p>

            <p>
                <b>Vehicle:</b> {cab ? `${cab.model || "Vehicle"} · ${cab.carNumber || "No registration"}` : "No vehicle assigned"}
            </p>

            <p>
                <b>Status:</b> {availability}
            </p>

        </div>

    )

}

export default DriverCard