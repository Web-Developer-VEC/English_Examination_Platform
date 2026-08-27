import api from "./api";
const base_URL = "/auth"

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (
    username,
    password,
    role
) => {

    const response = await api.post(
        `${base_URL}/login`,
        {
            username,
            password,
            role,
        }
    );

    return response.data;
};


// =====================================================
// REGISTER
// =====================================================

export const registerUser = async (userData) => {

    const response = await api.post(
        `${base_URL}/register`,
        userData
    );

    return response.data;
};


// =====================================================
// FORGOT PASSWORD - SEND OTP
// =====================================================

export const sendForgotPasswordOtp = async ({
    username,
    role,
}) => {

    const response = await api.post(
        `${base_URL}/forgot_password`,
        {
            username,
            role,
        }
    );

    return response.data;
};


// =====================================================
// FORGOT PASSWORD - VERIFY OTP
// =====================================================

export const validateForgotPasswordOtp = async ({
    username,
    role,
    otp,
}) => {

    const response = await api.post(
        `${base_URL}/otp_validation`,
        {
            username,
            role,
            otp,
        }
    );

    return response.data;
};


// =====================================================
// FORGOT PASSWORD - RESET PASSWORD
// =====================================================

export const resetForgotPassword = async ({
    username,
    role,
    resetToken,
    newPassword,
    confirmPassword,
}) => {

    const response = await api.post(
        `${base_URL}/reset_password`,
        {
            username,
            role,
            resetToken,
            newPassword,
            confirmPassword,
        }
    );

    return response.data;
};