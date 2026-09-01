const express = require("express");

const router = express.Router();

const {
  generateStudentResult,
} = require("../../controllers/student/studentResult.controller");

const {
  getStudentByUsername,
} = require("../../controllers/admin/student.controller");
const {
  updateStudent,
} = require("../../controllers/student/edit.student.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

router.put("/updatestudent", roleByAccess(["student"]), updateStudent);

// ==========================================================
// STUDENT EXAM PDF
// ==========================================================

router.post("/studentresult", roleByAccess(["student"]), generateStudentResult);

router.post("/getstudent", roleByAccess(["student"]), getStudentByUsername);

module.exports = router;
