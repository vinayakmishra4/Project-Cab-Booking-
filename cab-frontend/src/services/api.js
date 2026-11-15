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

let getAuthToken = () => null;

// The Redux store registers the token selector after store creation.
export const setAuthTokenProvider = (provider) => {
    getAuthToken = typeof provider === "function" ? provider : () => null;
};

api.interceptors.request.use((config) => {
    const token = getAuthToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
        delete config.headers.Authorization;
    }

    return config;
});

export default api;
