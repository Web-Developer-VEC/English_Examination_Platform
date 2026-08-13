import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const loginUser = async (username, password, role) => {
    const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
        role,
    });

    return response.data;
};

