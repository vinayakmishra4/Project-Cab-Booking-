import api from "./api";

export const estimateRide = (rideData) => api.get("/api/user/estimate-ride", {
    params: {
        pickupLat: rideData.pickupLat,
        pickupLng: rideData.pickupLng,
        dropLat: rideData.dropLat,
        dropLng: rideData.dropLng
    }
});

/* ================================
   BOOK RIDE
================================ */

export const bookRide = async (rideData, token = localStorage.getItem("token")) => {

    if (!token) {
        throw new Error("User not authenticated");
    }

    return await api.post(
        "/api/user/book-ride",
        null,
        {
            params: {
                pickupLat: rideData.pickupLat,
                pickupLng: rideData.pickupLng,
                dropLat: rideData.dropLat,
                dropLng: rideData.dropLng,
                pickupAddress: rideData.pickupAddress,
                dropoffAddress: rideData.dropoffAddress
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

};

/* ================================
   GET RIDE HISTORY
================================ */

export const getRideHistory = async (token) => {

    if (!token) {
        throw new Error("User not authenticated");
    }

    return await api.get(
        "/api/user/my-rides",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

};