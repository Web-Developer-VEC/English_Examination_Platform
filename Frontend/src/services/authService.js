import api from "./api";

export const loginUser = async (username, password, role) => {
    const response = await api.post("auth/login", {
        username,
        password,
        role,
    });

    return response.data;
};

export const sendForgotPasswordOtp = async ({ username, role }) => {
  const response = await axios.post(`${API_URL}/forgot_password`, {
    username,
    role,
  });

  return response.data;
};

// Verify OTP
export const validateForgotPasswordOtp = async ({
  username,
  role,
  otp,
}) => {
  const response = await axios.post(`${API_URL}/otp_validation`, {
    username,
    role,
    otp,
  });

  return response.data;
};

// Reset Password
export const resetForgotPassword = async ({
  username,
  role,
  resetToken,
  newPassword,
  confirmPassword,
}) => {
  const response = await axios.post(`${API_URL}/reset_password`, {
    username,
    role,
    resetToken,
    newPassword,
    confirmPassword,
  });

  return response.data;
};