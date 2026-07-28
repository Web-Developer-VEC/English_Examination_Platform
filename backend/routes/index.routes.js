const express = require("express");

const router = express.Router();

const questionRoutes = require("./staff/staff.routes");
const auth_routes = require("./auth/auth.routes")

router.use("/staff/questions", questionRoutes);
router.use("/auth",auth_routes);

module.exports = router;