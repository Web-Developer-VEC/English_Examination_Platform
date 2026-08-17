const express = require("express");

const router = express.Router();

const staffRoutes = require("./staff/staff.routes");
const auth_routes = require("./auth/auth.routes")
const student_routes=require("./student/student.routes")
const report_routes=require("./staff/report.routes")
const schedule_routes=require("./staff/schedule.routes")
router.use("/staff", staffRoutes);
router.use("/auth",auth_routes);
router.use("/student",student_routes);
router.use("/staff/report", report_routes);
router.use("/staff/schedule", schedule_routes);

module.exports = router;