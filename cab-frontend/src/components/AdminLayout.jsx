import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import api from "../services/api";

const emptyDashboard = { totalBookings: 0, tripsInProgress: 0 };

const workspaceLinks = [
    { to: "/admin", label: "Overview", icon: "▦", end: true },
    { to: "/admin/bookings", label: "Bookings", icon: "▤", count: "totalBookings" },
    { to: "/admin/live-trips", label: "Live trips", icon: "◎", count: "tripsInProgress" }
];

const managementLinks = [
    { to: "/admin/employees", label: "Employees", icon: "♙" },
    { to: "/admin/drivers", label: "Drivers", icon: "♧" },
    { to: "/admin/fleet", label: "Fleet", icon: "▣" },
    { to: "/admin/billing", label: "Billing", icon: "▧" }
];

function AdminLayout() {
    const [dashboard, setDashboard] = useState(emptyDashboard);
    const [serviceStatus, setServiceStatus] = useState("checking");
    const [error, setError] = useState("");
    const location = useLocation();
    const email = localStorage.getItem("userEmail") || "";

    const refreshCounts = useCallback(async () => {
        try {
            const response = await api.get("/api/admin/dashboard");
            setDashboard({ ...emptyDashboard, ...response.data });
            setServiceStatus("connected");
            setError("");
        } catch {
            setServiceStatus("unavailable");
            setError("Admin service is unavailable. Some navigation counts may be out of date.");
        }
    }, []);

    useEffect(() => {
        refreshCounts();
        const interval = window.setInterval(refreshCounts, 30000);
        return () => window.clearInterval(interval);
    }, [refreshCounts]);

    const pageTitle = [...workspaceLinks, ...managementLinks]
        .find((item) => item.to === location.pathname)?.label || "Overview";
    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("portal");
        localStorage.removeItem("userEmail");
        window.location.assign("/");
    };

    const renderLinks = (links) => links.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-side-link${isActive ? " active" : ""}`}>
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
            {item.count && <b>{Number(dashboard[item.count] || 0).toLocaleString("en-IN")}</b>}
        </NavLink>
    ));

    return (
        <div className="admin-portal">
            <aside className="admin-sidebar">
                <Link className="portal-side-brand" to="/admin" aria-label="GoCab admin home">
                    <span className="brand-mark portal-brand-mark">M</span>
                    <span className="brand-copy">
                        <span className="brand-word">Go<span>Cab</span></span>
                    </span>
                    <small>EMPLOYEE TRANSPORT</small>
                </Link>
                <div className="admin-workspace-badge">
                    <span className="admin-badge-mark">⌂</span>
                    <div><strong>Motherson India</strong><small>NCR operations</small></div>
                </div>
                <p className="side-nav-label">WORKSPACE</p>
                <nav aria-label="Workspace">{renderLinks(workspaceLinks)}</nav>
                <p className="side-nav-label side-nav-spaced">MANAGEMENT</p>
                <nav aria-label="Management">{renderLinks(managementLinks)}</nav>
                <div className="admin-sidebar-bottom">
                    <div className="admin-user-avatar">{email.charAt(0).toUpperCase() || "A"}</div>
                    <div className="admin-user-info"><strong>Administrator</strong><span>{email}</span></div>
                    <button className="btn btn-link admin-signout" type="button" onClick={signOut} aria-label="Sign out">↪</button>
                </div>
            </aside>
            <main className="admin-main">
                <header className="admin-topbar">
                    <div><span className="breadcrumb-muted">Transport management</span><span className="breadcrumb-slash">/</span> {pageTitle}</div>
                    <div className="admin-topbar-right">
                        <span className={`service-indicator ${serviceStatus}`}><i></i>{serviceStatus === "checking" ? "Connecting" : serviceStatus === "connected" ? "System online" : "Service issue"}</span>
                        <span className="admin-date">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                </header>
                <div className="admin-content">
                    {error && <p className="admin-inline-warning" role="status">{error}</p>}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
