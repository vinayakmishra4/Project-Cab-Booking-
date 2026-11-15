import api from "./api";

const API = "/api/auth";

/* LOGIN USER */

export const loginUser = async (data) => {

    const timeout = data.portal === "ADMIN" ? 120000 : 30000;
    const response = await api.post(`${API}/login`, data, { timeout });

    return response;

};

/* REGISTER USER */

export const registerUser = (data) => {
    return api.post(`${API}/register`, data);
};

export const changePassword = (data) => {
    return api.post(`${API}/change-password`, data);
};