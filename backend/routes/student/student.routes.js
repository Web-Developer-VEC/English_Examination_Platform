const express = require("express");

const router = express.Router();

const {
    generateStudentExamPDF
} = require("../../controllers/studentPdf.controller");

const{ studentAuth} =
    require("../../middleware/roleby.access.middleware");
const {
  getStudentByUsername
} = require("../../controllers/student.controller");
const {
    updateStudent
} = require("../../controllers/edit.student.controller");

router.put("/updatestudent", updateStudent);



// ==========================================================
// STUDENT EXAM PDF
// ==========================================================

router.post(
    "/exam/studentresult",
    generateStudentExamPDF
);

router.get("/getstudent", getStudentByUsername);

module.exports = router;
