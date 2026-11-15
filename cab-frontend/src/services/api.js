import axios from "axios";

const hostname = typeof window === "undefined" ? "localhost" : window.location.hostname;
const protocol = typeof window === "undefined" ? "http:" : window.location.protocol;
const apiHostname = hostname.includes(":") && !hostname.startsWith("[") ? `[${hostname}]` : hostname;
const baseURL = process.env.REACT_APP_API_BASE_URL
    || (process.env.NODE_ENV === "development" ? "" : `${protocol}//${apiHostname}:8080`);

const api = axios.create({
    baseURL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes("/api/auth/login");
        if (error.response && error.response.status === 401 && !isLoginRequest && localStorage.getItem("token")) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("email");
            sessionStorage.setItem("sessionExpiredMessage", "Your session expired due to inactivity. Please sign in again.");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;