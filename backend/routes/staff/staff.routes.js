const express = require("express");

const router = express.Router();

const questions_upload_Middleware = require("../../middleware/questionupload_middleware");
const {
  questionsupload,
} = require("../../controllers/admin/questions.controller");
const { scheduleExam } = require("../../controllers/admin/schedule.controller");
const {
  getStudentsByDepartmentAndBatch,
} = require("../../controllers/general_admin/getscheduleexam.controller");

const student_upload_Middleware = require("../../middleware/student_upload_middleware");
const {
  studentsUpload,
} = require("../../controllers/admin/student.controller");
const { updateStudent } = require("../../controllers/admin/student.controller");
const scheduleRoutes = require("./schedule.routes");
const {
  generateExamReport,
} = require("../../controllers/general_admin/result.controller");
const {
  deleteQuestionSet,
} = require("../../controllers/admin/delete.question.controller");
const {
  updateStaff,
  getStaff,
} = require("../../controllers/admin/staff.controller");
const {
  updateAcademicYear,
  updateStudentEditPermission,
  getAdminSettings,
  getStudentEditPermission,
} = require("../../controllers/admin/admin.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

router.put("/academic-year", roleByAccess(["admin"]), updateAcademicYear);

// Enable / disable student editing
router.put(
  "/student-edit",
  roleByAccess(["admin"]),
  updateStudentEditPermission,
);

// Get current settings
router.get("/academic-year", roleByAccess(["admin"]), getAdminSettings);
router.get(
  "/admin/student-edit/:admissionNo",
  roleByAccess(["admin"]),
  getStudentEditPermission,
);

// Upload Student Excel
router.post("/studentsupload",roleByAccess(["admin"]),student_upload_Middleware, studentsUpload);
router.put("/studentsupdate", roleByAccess(["admin"]),student_upload_Middleware, updateStudent);
// Upload Audio + Excel
router.post(
  "/questionsupload",
  roleByAccess(["admin"]),
  questions_upload_Middleware,
  questionsupload,
);
router.delete(
  "/delete-question-set",
  roleByAccess(["admin"]),
  deleteQuestionSet,
);

router.post(
  "/exam-results",
  roleByAccess(["admin", "staff"]),
  generateExamReport,
);
router.post(
  "/student-data",
  roleByAccess(["admin"]),
  getStudentsByDepartmentAndBatch,
);
router.get("/getstaff", roleByAccess(["admin"]), getStaff);
router.post("/updatestaff", roleByAccess(["admin"]), updateStaff);
router.use("/schedule", scheduleRoutes);

module.exports = router;
