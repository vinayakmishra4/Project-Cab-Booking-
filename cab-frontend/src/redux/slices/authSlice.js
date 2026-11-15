import { createSlice } from "@reduxjs/toolkit";

const readStorage = (key) => {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

const initialState = {
    token: readStorage("token"),
    portal: readStorage("portal"),
    userEmail: readStorage("userEmail"),
    userName: readStorage("userName"),
    isAuthenticated: Boolean(readStorage("token"))
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth: (state, action) => {
            const { token, portal, userEmail, userName } = action.payload || {};
            state.token = token || null;
            state.portal = portal || null;
            state.userEmail = userEmail || null;
            state.userName = userName || null;
            state.isAuthenticated = Boolean(token);
        },
        setUserEmail: (state, action) => {
            state.userEmail = action.payload || null;
        },
        setUserName: (state, action) => {
            state.userName = action.payload || null;
        },
        clearAuth: (state) => {
            state.token = null;
            state.portal = null;
            state.userEmail = null;
            state.userName = null;
            state.isAuthenticated = false;
        }
    }
});

export const { setAuth, setUserEmail, setUserName, clearAuth } = authSlice.actions;
export default authSlice.reducer;
