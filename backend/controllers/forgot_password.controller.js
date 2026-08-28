const { getDB } = require("../config/db");
const crypto = require("crypto");
const { sendOtpEmail } = require("../service/forgetPass_mail.service");
const bcrypt = require("bcryptjs");
const { addEmailToQueue } = require("../utils/sesEmailQueue");

require("dotenv").config();

// =========================================================
// FORGOT PASSWORD - SEND OTP
// =========================================================

const forgotpassword = async (req, res) => {
  try {
    const db = getDB();

    const { username, role } = req.body;

    // VALIDATION
    if (!username || !role) {
      return res.status(400).json({
        message: "Username and role are required",
      });
    }

    // VALIDATE ROLE
    if (!["student", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid authorization",
      });
    }

    // SELECT COLLECTION
    const collection = role === "student" ? "students" : "staff";

    const normalizedUsername = username.trim();

    // FIND USER
    const user = await db.collection(collection).findOne({
      username: normalizedUsername,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // GENERATE OTP
    const otp = crypto.randomInt(1000, 10000).toString();

    // HASH OTP
    const hashedOtp = crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(otp)
      .digest("hex");

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // SAVE OTP
    await db.collection(collection).updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          resetOtp: hashedOtp,
          resetOtpExpiry: otpExpiry,
        },
      },
    );

    // SEND OTP TO EMAIL
    await addEmailToQueue(() =>
      sendOtpEmail({
        to: user.email,
        otp,
      }),
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =========================================================
// OTP VALIDATION
// =========================================================

const otpValidation = async (req, res) => {
  try {
    const db = getDB();

    const { username, otp, role } = req.body;

    // VALIDATION
    if (!username || !otp || !role) {
      return res.status(400).json({
        message: "Username, OTP and role are required",
      });
    }

    // VALIDATE ROLE
    if (!["student", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid authorization",
      });
    }

    // SELECT COLLECTION
    const collection = role === "student" ? "students" : "staff";

    const normalizedUsername = username.trim();

    // HASH OTP
    const hashedOtp = crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(otp)
      .digest("hex");

    // VALIDATE USER + OTP
    const user = await db.collection(collection).findOne({
      username: normalizedUsername,
      resetOtp: hashedOtp,
      resetOtpExpiry: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // GENERATE TEMPORARY RESET TOKEN
    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // REMOVE OTP + SAVE RESET TOKEN
    await db.collection(collection).updateOne(
      {
        _id: user._id,
      },
      {
        $unset: {
          resetOtp: "",
          resetOtpExpiry: "",
        },

        $set: {
          resetToken,
          resetTokenExpiry,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "OTP is validated",

      // Frontend needs this for password reset
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================================================
// RESET PASSWORD
// =========================================================

const resetPassword = async (req, res) => {
  try {
    const db = getDB();

    const { username, role, resetToken, newPassword, confirmPassword } =
      req.body;

    // VALIDATION
    if (!username || !role || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Username, role, reset token and passwords are required",
      });
    }

    // VALIDATE ROLE
    if (!["student", "staff", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid authorization",
      });
    }

    // SELECT COLLECTION
    const collection = role === "student" ? "students" : "staff";

    // PASSWORD MATCH
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // PASSWORD LENGTH
    if (newPassword.length < 8 || newPassword.length > 12) {
      return res.status(400).json({
        message: "Password must be between 8 and 12 characters",
      });
    }

    const normalizedUsername = username.trim();

    // VERIFY RESET TOKEN
    const user = await db.collection(collection).findOne({
      username: normalizedUsername,
      resetToken,
      resetTokenExpiry: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset session",
      });
    }

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // UPDATE PASSWORD + REMOVE TOKEN
    await db.collection(collection).updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },

        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  forgotpassword,
  otpValidation,
  resetPassword,
};
