
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    token: localStorage.getItem("token"),
    portal: localStorage.getItem("portal"),
    userEmail: localStorage.getItem("userEmail"),
    userName: localStorage.getItem("userName"),
    isAuthenticated: !!localStorage.getItem("token")
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAuth: (state, action) => {
            const { token, portal, userEmail, userName } = action.payload;

            state.token = token;
            state.portal = portal;
            state.userEmail = userEmail;
            state.userName = userName || null;
            state.isAuthenticated = !!token;
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

export const { setAuth, clearAuth } = authSlice.actions;

export default authSlice.reducer;
