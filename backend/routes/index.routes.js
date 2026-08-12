const express = require("express");

const router = express.Router();

const questionRoutes = require("./staff/staff.routes");
const auth_routes = require("./auth/auth.routes")
const student_routes=require("./student/student.routes")
const result_routes=require("./staff/report.routes")
const schedule_routes=require("./staff/schedule.routes")
router.use("/staff/questions", questionRoutes);
router.use("/auth",auth_routes);
router.use("/student",student_routes);
router.use("/staff/report", result_routes);
router.use("/staff/schedule", schedule_routes);

module.exports = router;