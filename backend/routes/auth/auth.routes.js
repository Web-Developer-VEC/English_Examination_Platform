const express = require("express");

const router = express.Router();

const { register, login } = require("../../controllers/Auth/auth.controller");
const {
  forgotpassword,
  otpValidation,
  resetPassword,
} = require("../../controllers/Auth/forgot_password.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot_password", forgotpassword);
router.post("/otp_validation", otpValidation);
router.post("/reset_password", resetPassword);

module.exports = router;
