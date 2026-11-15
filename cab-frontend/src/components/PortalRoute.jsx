import { Navigate } from "react-router-dom";

function PortalRoute({ portal, children }) {
    const hasSession = Boolean(localStorage.getItem("token"));
    const hasPortalAccess = localStorage.getItem("portal") === portal;

    if (!hasSession || !hasPortalAccess) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default PortalRoute;
