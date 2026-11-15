import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

const emptyDashboard = { totalBookings: 0, tripsInProgress: 0 };

export const fetchAdminDashboard = createAsyncThunk(
    "admin/fetchDashboard",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/api/admin/dashboard");
            return { ...emptyDashboard, ...response.data };
        } catch {
            return rejectWithValue("Admin service is unavailable. Some navigation counts may be out of date.");
        }
    }
);

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        dashboard: emptyDashboard,
        serviceStatus: "checking",
        error: null
    },
    reducers: {
        clearAdminState: (state) => {
            state.dashboard = emptyDashboard;
            state.serviceStatus = "checking";
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminDashboard.pending, (state) => {
                state.serviceStatus = "checking";
                state.error = null;
            })
            .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
                state.dashboard = action.payload;
                state.serviceStatus = "connected";
                state.error = null;
            })
            .addCase(fetchAdminDashboard.rejected, (state, action) => {
                state.serviceStatus = "unavailable";
                state.error = action.payload || "Admin service is unavailable.";
            })
            .addCase("auth/clearAuth", (state) => {
                state.dashboard = emptyDashboard;
                state.serviceStatus = "checking";
                state.error = null;
            });
    }
});

export const { clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;
