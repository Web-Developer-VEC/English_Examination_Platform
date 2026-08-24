const express = require("express");

const router = express.Router();

const staffRoutes = require("./staff/staff.routes");
const auth_routes = require("./auth/auth.routes")
const exam_routes=require("./exams/exams.routes")
const student_routes=require("./student/student.routes")
router.use("/staff", staffRoutes);
router.use("/auth",auth_routes);
router.use("/exam",exam_routes);
router.use("/student",student_routes);

module.exports = router;