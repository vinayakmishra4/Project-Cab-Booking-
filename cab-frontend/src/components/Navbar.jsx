import { Link, useNavigate } from "react-router-dom";

function Navbar({ portal = localStorage.getItem("portal") || "EMPLOYEE" }){
    const navigate = useNavigate();
    const home = portal === "ADMIN" ? "/admin" : portal === "DRIVER" ? "/driver/dashboard" : "/dashboard";
    const links = portal === "EMPLOYEE"
        ? [{ to: "/book", label: "Book a ride" }, { to: "/live-track", label: "Live tracking" }, { to: "/history", label: "Ride history" }]
        : [];

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("portal");
        localStorage.removeItem("userEmail");
        navigate("/", { replace: true });
    };

    return(

        <nav className="app-navbar">
            <Link className="navbar-brand" to={home} aria-label="GoCab dashboard">
                <span className="brand-mark navbar-brand-mark">M</span>
                <span className="brand-copy">
                    <span className="brand-word">Go<span>Cab</span></span>
                </span>
            </Link>
            <div className="navbar-links">
                {links.map((link) => (
                    <Link key={link.to} to={link.to}>{link.label}</Link>
                ))}
                <button className="btn btn-outline-primary navbar-signout" type="button" onClick={signOut}>Sign out</button>
            </div>
        </nav>

    )
}

export default Navbar
