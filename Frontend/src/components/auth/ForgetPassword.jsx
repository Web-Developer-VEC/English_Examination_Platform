import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  sendForgotPasswordOtp,
  validateForgotPasswordOtp,
  resetForgotPassword,
} from "../../services/authService";

const ForgetPassword = () => {
  // =========================
  // STEP
  // =========================
  const [step, setStep] = useState(1);

  // =========================
  // USER DETAILS
  // =========================
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  // =========================
  // OTP
  // =========================
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  // =========================
  // PASSWORD
  // =========================
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =========================
  // UI
  // =========================
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // STEP 1 - SEND OTP
  // =====================================================

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!username.trim() || !role) {
      setError("Username and role are required");
      return;
    }

    try {
      setLoading(true);

      const data = await sendForgotPasswordOtp({
        username: username.trim(),
        role,
      });

      console.log("Forgot Password Response:", data);

      setMessage(data.message || "OTP sent successfully");

      setStep(2);
    } catch (error) {
      console.error("Forgot Password Error:", error);

      setError(
        error.response?.data?.message ||
        "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 2 - VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }

    if (otp.length !== 4) {
      setError("OTP must be 4 digits");
      return;
    }

    try {
      setLoading(true);

      const data = await validateForgotPasswordOtp({
        username: username.trim(),
        role,
        otp: otp.trim(),
      });

      console.log("OTP Validation Response:", data);

      if (data.success) {
        setResetToken(data.resetToken);

        setMessage(data.message || "OTP verified successfully");

        setStep(3);
      }
    } catch (error) {
      console.error("OTP Validation Error:", error);

      setError(
        error.response?.data?.message ||
        "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 3 - RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter both passwords");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 12) {
      setError("Password must be between 8 and 12 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const data = await resetForgotPassword({
        username: username.trim(),
        role,
        resetToken,
        newPassword,
        confirmPassword,
      });

      console.log("Reset Password Response:", data);

      if (data.success) {
        setMessage(data.message || "Password reset successful");

        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          window.history.back();
        }, 2000);
      }
    } catch (error) {
      console.error("Reset Password Error:", error);

      setError(
        error.response?.data?.message ||
        "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    if (loading) return;

    if (step === 1) {
      window.history.back();
    } else {
      setError("");
      setMessage("");
      setStep(step - 1);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed top-[150px] left-0 right-0 bottom-0 overflow-hidden bg-gray-100 flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* ================================
    STEP INDICATOR
================================= */}

        <div className="flex items-center justify-center gap-3 mb-8">

          {/* STEP 1 */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1
              ? "bg-[#FDCC03] text-white"
              : "bg-gray-200 text-gray-500"
              }`}
          >
            1
          </div>

          {/* LINE 1 */}
          <div
            className={`h-1 w-10 ${step >= 2
              ? "bg-[#FDCC03]"
              : "bg-gray-200"
              }`}
          />

          {/* STEP 2 */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2
              ? "bg-[#FDCC03] text-white"
              : "bg-gray-200 text-gray-500"
              }`}
          >
            2
          </div>

          {/* LINE 2 */}
          <div
            className={`h-1 w-10 ${step >= 3
              ? "bg-[#FDCC03]"
              : "bg-gray-200"
              }`}
          />

          {/* STEP 3 */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 3
              ? "bg-[#FDCC03] text-white"
              : "bg-gray-200 text-gray-500"
              }`}
          >
            3
          </div>

        </div>

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <>
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-gray-800">
                Forgot Password
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Enter your username and select your role to receive an OTP.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-5">

              {/* ROLE */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Role
                </label>

                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-black/15 rounded-lg outline-none focus:outline-none focus:ring-2 focus:ring-[#fdcc03]/15 focus:border-[#fdcc03] disabled:bg-gray-100"
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* USERNAME */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-black/15 rounded-lg outline-none focus:ring-2 focus:ring-[#fdcc03]/15 focus:border-[#fdcc03] disabled:bg-gray-100"
                />
              </div>

              {/* ERROR */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              {/* SUCCESS */}
              {message && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  {message}
                </p>
              )}

              {/* SEND OTP */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FDCC03] hover:bg-[#7a1f2b] text-white font-semibold rounded-lg transition disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full mt-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Back to Login
            </button>
          </>
        )}

        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 2 && (
          <>
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-gray-800">
                Verify OTP
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Enter the 4-digit OTP sent to your registered email.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">

              {/* OTP */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  OTP
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength="4"
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, ""))
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 text-center text-base tracking-[0.1em] font-semibold border border-black/15 rounded-lg outline-none focus:ring-2 focus:ring-[#fdcc03]/15 focus:border-[#fdcc03] disabled:bg-gray-100"
                />
              </div>

              {/* ERROR */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              {/* SUCCESS */}
              {message && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  {message}
                </p>
              )}

              {/* VERIFY */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FDCC03] hover:bg-[#7a1f2b] text-white font-semibold rounded-lg transition disabled:bg-orange-300 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full mt-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Back
            </button>
          </>
        )}

        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 3 && (
          <>
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-gray-800">
                Reset Password
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-5">

              {/* NEW PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>

                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 border border-black/15 rounded-lg outline-none focus:ring-2 focus:ring-[#fdcc03]/15 focus:border-[#fdcc03] disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#7a1f2b] transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 border border-black/15 rounded-lg outline-none focus:ring-2 focus:ring-[#fdcc03]/15 focus:border-[#fdcc03] disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Password must be 8–12 characters.
              </p>

              {/* ERROR */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              {/* SUCCESS */}
              {message && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  {message}
                </p>
              )}

              {/* RESET */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#FDCC03] hover:bg-[#7a1f2b] text-white font-semibold rounded-lg transition disabled:bg-[#e5b900] disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;