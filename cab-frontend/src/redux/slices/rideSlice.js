import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getRideHistory } from "../../services/rideService";

export const fetchRideHistory = createAsyncThunk(
    "rides/fetchRideHistory",
    async (token, { rejectWithValue }) => {
        try {
            const response = await getRideHistory(token);
            if (!Array.isArray(response.data)) {
                return rejectWithValue("The server returned an invalid booking list.");
            }
            return response.data;
        } catch (error) {
            const data = error.response?.data;
            const message = typeof data === "string"
                ? data
                : data?.message || data?.detail || error.message;
            return rejectWithValue(message || "Could not load your bookings.");
        }
    }
);

const rideSlice = createSlice({
    name: "rides",
    initialState: {
        items: [],
        loading: false,
        error: null,
        lastFetched: null
    },
    reducers: {
        clearRideHistory: (state) => {
            state.items = [];
            state.loading = false;
            state.error = null;
            state.lastFetched = null;
        },
        setRideHistory: (state, action) => {
            state.items = Array.isArray(action.payload) ? action.payload : [];
            state.error = null;
            state.lastFetched = Date.now();
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRideHistory.pending, (state) => {
                state.loading = state.lastFetched === null;
                state.error = null;
            })
            .addCase(fetchRideHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchRideHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Could not load your bookings.";
            })
            .addCase("auth/clearAuth", (state) => {
                state.items = [];
                state.loading = false;
                state.error = null;
                state.lastFetched = null;
            });
    }
});

export const { clearRideHistory, setRideHistory } = rideSlice.actions;
export default rideSlice.reducer;
