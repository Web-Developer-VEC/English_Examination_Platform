import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
    (config) => {

        // Check student session first
        let savedSession =
            sessionStorage.getItem("studentSession");

        // If no student session, check admin session
        if (!savedSession) {
            savedSession =
                sessionStorage.getItem("adminSession");
        }

        if (savedSession) {

            try {

                const session =
                    JSON.parse(savedSession);

                if (session?.token) {

                    config.headers.Authorization =
                        `Bearer ${session.token}`;
                }

            } catch (error) {

                console.error(
                    "Invalid session data:",
                    error
                );

            }
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default api;
