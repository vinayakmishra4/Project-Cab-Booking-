
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function PortalRoute({ portal, children }) {

    const location = useLocation();

    // Get authentication details from Redux
    const { token, portal: userPortal, isAuthenticated } = useSelector(
        (state) => state.auth
    );

    // Redirect if user is not authenticated
    if (!isAuthenticated || !token) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Redirect if user tries to access another portal
    if (userPortal !== portal) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default PortalRoute;
