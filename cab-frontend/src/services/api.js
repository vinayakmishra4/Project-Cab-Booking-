
import axios from "axios";


// Determine the hostname and protocol based on the environment (server-side or client-side)
const hostname =
    typeof window === "undefined"
        ? "localhost"
        : window.location.hostname;

const protocol =
    typeof window === "undefined"
        ? "http:"
        : window.location.protocol;


// Handle IPv6 addresses by wrapping them in square brackets if necessary        
const apiHostname =
    hostname.includes(":") && !hostname.startsWith("[")
        ? `[${hostname}]`
        : hostname;

// Vite environment configuration
const baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
        ? ""
        : `${protocol}//${apiHostname}:8080`);

const api = axios.create({
    baseURL
});

// Automatically attach authentication token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
