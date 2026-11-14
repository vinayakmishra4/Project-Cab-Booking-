import { Navigate, useLocation } from "react-router-dom";

function PortalRoute({ portal, children }) {

    const location = useLocation();

    const token = localStorage.getItem("token");
    const userPortal = localStorage.getItem("portal");

    if (!token) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    if (userPortal !== portal) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default PortalRoute;