import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

const getDataForLog = (data) => {
  if (data instanceof FormData) {
    return Object.fromEntries(data.entries());
  }

  if (typeof data !== "string") {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

api.interceptors.request.use(
  (config) => {
    // Check student session first
    let savedSession = sessionStorage.getItem("studentSession");

    // If no student session, check admin session
    if (!savedSession) {
      savedSession = sessionStorage.getItem("adminSession");
    }

    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);

        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (error) {
        console.error("Invalid session data:", error);
      }
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const request = error?.config;
    const requestData = getDataForLog(request?.data);
    const responseData = getDataForLog(error?.response?.data);

    console.error("API request failed:", {
      method: request?.method?.toUpperCase(),
      endpoint: request
        ? `${request.baseURL || ""}${request.url || ""}`
        : undefined,
      requestData,
      responseData,
      message:
        responseData?.message ||
        responseData?.error ||
        error?.message ||
        "Request failed.",
    });
    return Promise.reject(error);
  },
);

export default api;
