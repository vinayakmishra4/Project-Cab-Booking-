import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const IdleSessionManager = () => {
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const lastPingRef = useRef(0);
  const isLoggingOutRef = useRef(false);

  const getSessionInfo = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = (payload.role || "").toUpperCase();
      // 15 mins for ADMIN, 30 mins for USER (Employee) and DRIVER
      const timeoutMs = role === "ADMIN" ? 15 * 60 * 1000 : 30 * 60 * 1000;
      return { token, role, timeoutMs };
    } catch {
      return null;
    }
  };

  const performLogout = useCallback(async (expired = false) => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    const token = localStorage.getItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("portal");
    localStorage.removeItem("userEmail");

    if (expired) {
      sessionStorage.setItem(
        "sessionExpiredMessage",
        "Your session expired due to inactivity. Please sign in again."
      );
    }

    if (token) {
      try {
        await api.post(
          "/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // Ignore errors if session already expired
      }
    }

    navigate("/", { replace: true });
    isLoggingOutRef.current = false;
  }, [navigate]);
  
  const pingBackendActivity = useCallback(async () => {
    const now = Date.now();
    // Throttle backend pings to at most once every 60 seconds
    if (now - lastPingRef.current < 60 * 1000) return;
    lastPingRef.current = now;

    try {
      await api.post("/api/auth/activity");
    } catch {
      // 401 is handled globally by api.js interceptor
    }
  }, []);

  useEffect(() => {
    const handleUserActivity = () => {
      const session = getSessionInfo();
      if (!session) return;

      const now = Date.now();
      if (now - lastActivityRef.current > session.timeoutMs) {
        performLogout(true);
        return;
      }

      lastActivityRef.current = now;
      pingBackendActivity();
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) =>
      window.addEventListener(event, handleUserActivity, { passive: true })
    );

    // Check every 15 seconds if the idle threshold has passed
    const intervalId = setInterval(() => {
      const session = getSessionInfo();
      if (!session) return;

      if (Date.now() - lastActivityRef.current >= session.timeoutMs) {
        performLogout(true);
      }
    }, 15 * 1000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleUserActivity)
      );
      clearInterval(intervalId);
    };
  }, [performLogout, pingBackendActivity]);

  return null;
};

export default IdleSessionManager;