
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
            const payloadPart = token.split(".")[1];

            if (!payloadPart) return null;

            // Decode Base64URL JWT payload
            const base64 = payloadPart
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const paddedBase64 = base64.padEnd(
                Math.ceil(base64.length / 4) * 4,
                "="
            );

            const payload = JSON.parse(atob(paddedBase64));
            const role = (payload.role || "").toUpperCase();

            // ADMIN and SECTION MANAGER: 15 minutes
            // EMPLOYEE: 30 minutes
            // DRIVER: 60 minutes
            const timeoutMs =
                role === "ADMIN" || role === "SECTION_MANAGER"
                    ? 15 * 60 * 1000
                    : role === "DRIVER"
                        ? 60 * 60 * 1000
                        : 30 * 60 * 1000;

            return { token, role, timeoutMs };
        } catch (error) {
            console.error("Unable to read JWT session information:", error);
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

    // Send backend activity ping at most once every 60 seconds
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
            lastPingRef.current = 0;
            return;
        }

        // Start a fresh inactivity timer for the authenticated session
        lastActivityRef.current = Date.now();
        lastPingRef.current = 0;
        isLoggingOutRef.current = false;

        const handleUserActivity = () => {
            const session = getSessionInfo();

            if (!session || isLoggingOutRef.current) return;

            const now = Date.now();

            // Do not allow activity to revive an expired session
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
            "click",
            "pointerdown",
        ];

        events.forEach((event) => {
            window.addEventListener(
                event,
                handleUserActivity,
                { passive: true }
            );
        });

        // Check inactivity every 15 seconds
        const intervalId = setInterval(() => {
            const session = getSessionInfo();

            if (!session || isLoggingOutRef.current) return;

            const inactiveTime =
                Date.now() - lastActivityRef.current;

            if (inactiveTime >= session.timeoutMs) {
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
