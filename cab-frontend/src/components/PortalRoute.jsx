import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

function PortalRoute({ portal, children }) {
    const location = useLocation();
    const { token, portal: userPortal, isAuthenticated } = useSelector((state) => state.auth);

    if (!isAuthenticated || !token || userPortal !== portal) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return children;
}

export default PortalRoute;
