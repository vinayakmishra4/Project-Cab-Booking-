
import axios from "axios";

const hostname =
    typeof window === "undefined"
        ? "localhost"
        : window.location.hostname;

const protocol =
    typeof window === "undefined"
        ? "http:"
        : window.location.protocol;

const apiHostname =
    hostname.includes(":") && !hostname.startsWith("[")
        ? `[${hostname}]`
        : hostname;

const baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
        ? ""
        : `${protocol}//${apiHostname}:8080`);

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

export default api;
