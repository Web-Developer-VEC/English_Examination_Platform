import api from "./api";

export const loginUser = async (username, password, role) => {
    const response = await api.post("auth/login", {
        username,
        password,
        role,
    });

    return response.data;
};

