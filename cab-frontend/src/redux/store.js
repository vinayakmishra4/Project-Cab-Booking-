import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import rideReducer from "./slices/rideSlice";
import adminReducer from "./slices/adminSlice";
import { setAuthTokenProvider } from "../services/api";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        rides: rideReducer,
        admin: adminReducer
    }
});

setAuthTokenProvider(() => store.getState().auth.token);

const persistAuth = (auth) => {
    if (typeof window === "undefined") return;

    try {
        const entries = [
            ["token", auth.token],
            ["portal", auth.portal],
            ["userEmail", auth.userEmail],
            ["userName", auth.userName]
        ];

        entries.forEach(([key, value]) => {
            if (value) window.localStorage.setItem(key, value);
            else window.localStorage.removeItem(key);
        });
    } catch {
        // Redux remains the source of truth if browser storage is unavailable.
    }
};

// Keep localStorage as reload persistence only; Redux remains the app state source.
let previousAuth = store.getState().auth;
store.subscribe(() => {
    const currentAuth = store.getState().auth;
    if (currentAuth !== previousAuth) {
        previousAuth = currentAuth;
        persistAuth(currentAuth);
    }
});

export default store;
