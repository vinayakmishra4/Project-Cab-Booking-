import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { clearAuth } from "../redux/slices/authSlice";

function Navbar({ portal: portalProp }){
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const storedPortal = useSelector((state) => state.auth.portal);
    const portal = portalProp || storedPortal || "EMPLOYEE";
    const home = portal === "ADMIN" ? "/admin" : portal === "DRIVER" ? "/driver/dashboard" : "/dashboard";
    const links = portal === "EMPLOYEE"
        ? [{ to: "/book", label: "Book a ride" }, { to: "/live-track", label: "Live tracking" }, { to: "/history", label: "Ride history" }]
        : [];

    const signOut = () => {
        dispatch(clearAuth());
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
                <button className="navbar-signout" type="button" onClick={signOut}>Sign out</button>
            </div>
        </nav>
    )
}

export default Navbar;
