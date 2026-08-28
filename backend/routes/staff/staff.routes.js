const express = require("express");

const router = express.Router();

const questions_upload_Middleware = require("../../middleware/questionupload_middleware");
const { questionsupload } = require("../../controllers/questions.controller");
const { scheduleExam } = require("../../controllers/schedule.controller");
const {getStudentsByDepartmentAndBatch}=require("../../controllers/getscheduleexam.controller");

const student_upload_Middleware = require("../../middleware/student_upload_middleware");
const { studentsUpload } = require("../../controllers/student.controller");
const { updateStudent } = require("../../controllers/student.controller");
const scheduleRoutes = require("./schedule.routes");
const { generateExamReport } = require("../../controllers/result.controller");
const{deleteQuestionSet}=require("../../controllers/delete.question.controller");
const { updateStaff,getStaff } = require("../../controllers/staff.controller");
const {
    updateAcademicYear,
    updateStudentEditPermission,
    getAdminSettings,getStudentEditPermission
} = require("../../controllers/admin.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

router.put(
    "/academic-year",
    roleByAccess(["admin"]),
    updateAcademicYear
);


// Enable / disable student editing
router.put(
    "/student-edit",
    roleByAccess(["admin"]),
    updateStudentEditPermission
);


// Get current settings
router.get(
    "/academic-year",
    roleByAccess(["admin"]),
    getAdminSettings
);
router.get(
    "/admin/student-edit/:admissionNo",
    roleByAccess(["admin"]),
    getStudentEditPermission
);



// Upload Student Excel
router.post("/studentsupload",student_upload_Middleware, studentsUpload);
router.put("/studentsupdate", roleByAccess(["admin"]),student_upload_Middleware, updateStudent);
// Upload Audio + Excel
router.post("/questionsupload",roleByAccess(["admin"]), questions_upload_Middleware, questionsupload);
router.delete("/delete-question-set", roleByAccess(["admin"]),deleteQuestionSet);

router.post("/exam-results",roleByAccess(["admin","staff"]), generateExamReport);
router.post("/student-data",roleByAccess(["admin"]),getStudentsByDepartmentAndBatch);
router.get("/getstaff",roleByAccess(["admin"]), getStaff);
router.post("/updatestaff",roleByAccess(["admin"]), updateStaff);
router.use("/schedule",scheduleRoutes);

module.exports = router;
