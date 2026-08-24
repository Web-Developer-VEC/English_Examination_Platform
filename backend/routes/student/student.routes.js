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


// ==========================================================
// STUDENT EXAM PDF
// ==========================================================

router.post(
    "/exam/studentresult",
    generateStudentExamPDF
);

router.get("/getstudent", getStudentByUsername);

module.exports = router;
