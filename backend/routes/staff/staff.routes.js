const express = require("express");

const router = express.Router();
const staffAuth = require("../../middleware/roleby.access.middleware");

const questions_upload_Middleware = require("../../middleware/questionupload_middleware");
const { questionsupload } = require("../../controllers/questions.controller");
const { scheduleExam } = require("../../controllers/schedule.controller");

const student_upload_Middleware = require("../../middleware/student_upload_middleware");
const { studentsUpload } = require("../../controllers/student.controller");
const { updateStudent } = require("../../controllers/student.controller");
const scheduleRoutes = require("./schedule.routes");

// Upload Student Excel
router.post("/studentsupload", student_upload_Middleware, studentsUpload);
router.put("/studentsupdate", student_upload_Middleware, updateStudent);
// Upload Audio + Excel
router.post("/questionsupload", questions_upload_Middleware, questionsupload);



router.use("/schedule", scheduleRoutes);

module.exports = router;
