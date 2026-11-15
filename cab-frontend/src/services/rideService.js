
import api from "./api";

/* ESTIMATE RIDE FARE */
export const estimateRide = (rideData) => {
    return api.get("/api/user/estimate-ride", {
        params: {
            pickupLat: rideData.pickupLat,
            pickupLng: rideData.pickupLng,
            dropLat: rideData.dropLat,
            dropLng: rideData.dropLng
        }
    });
};

/* BOOK RIDE */
export const bookRide = (rideData) => {
    return api.post("/api/user/book-ride", null, {
        params: {
            pickupLat: rideData.pickupLat,
            pickupLng: rideData.pickupLng,
            dropLat: rideData.dropLat,
            dropLng: rideData.dropLng,
            pickupAddress: rideData.pickupAddress,
            dropoffAddress: rideData.dropoffAddress,
            vehicleType: rideData.vehicleType
        }
    });
};

/* GET RIDE HISTORY */
export const getRideHistory = () => {
    return api.get("/api/user/my-rides");
};
