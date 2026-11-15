
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { clearAuth } from "../redux/slices/authSlice";

const IdleSessionManager = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const token = useSelector((state) => state.auth.token);

    const lastActivityRef = useRef(Date.now());
    const lastPingRef = useRef(0);
    const isLoggingOutRef = useRef(false);

    // Get session information from JWT
    const getSessionInfo = useCallback(() => {
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const role = (payload.role || "").toUpperCase();

            // ADMIN: 15 minutes
            // EMPLOYEE / DRIVER: 30 minutes
            const timeoutMs =
                role === "ADMIN"
                    ? 15 * 60 * 1000
                    : 30 * 60 * 1000;

            return { token, role, timeoutMs };
        } catch {
            return null;
        }
    }, [token]);

    // Logout and clear Redux authentication
    const performLogout = useCallback(
        async (expired = false) => {
            if (isLoggingOutRef.current) return;

            isLoggingOutRef.current = true;

            if (expired) {
                sessionStorage.setItem(
                    "sessionExpiredMessage",
                    "Your session expired due to inactivity. Please sign in again."
                );
            }

            try {
                if (token) {
                    try {
                        await api.post(
                            "/api/auth/logout",
                            {},
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );
                    } catch {
                        // Continue logout even if backend logout fails
                    }
                }
            } finally {
                dispatch(clearAuth());

                localStorage.removeItem("token");
                localStorage.removeItem("portal");
                localStorage.removeItem("userEmail");
                localStorage.removeItem("userName");

                navigate("/", { replace: true });
                isLoggingOutRef.current = false;
            }
        },
        [dispatch, navigate, token]
    );

    // Send backend activity ping (maximum once every 60 seconds)
    const pingBackendActivity = useCallback(async () => {
        const now = Date.now();

        if (now - lastPingRef.current < 60 * 1000) {
            return;
        }

        lastPingRef.current = now;

        try {
            await api.post("/api/auth/activity");
        } catch {
            // Ignore activity ping errors
        }
    }, []);

    useEffect(() => {
        if (!token) {
            lastActivityRef.current = Date.now();
            return;
        }

        const handleUserActivity = () => {
            const session = getSessionInfo();

            if (!session) return;

            const now = Date.now();

            if (
                now - lastActivityRef.current >= session.timeoutMs
            ) {
                performLogout(true);
                return;
            }

            lastActivityRef.current = now;
            pingBackendActivity();
        };

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
        ];

        events.forEach((event) => {
            window.addEventListener(
                event,
                handleUserActivity,
                { passive: true }
            );
        });

        // Check idle timeout every 15 seconds
        const intervalId = setInterval(() => {
            const session = getSessionInfo();

            if (!session) return;

            if (
                Date.now() - lastActivityRef.current >=
                session.timeoutMs
            ) {
                performLogout(true);
            }
        }, 15 * 1000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(
                    event,
                    handleUserActivity
                );
            });

            clearInterval(intervalId);
        };
    }, [
        token,
        getSessionInfo,
        performLogout,
        pingBackendActivity,
    ]);

    return null;
};

export default IdleSessionManager;
