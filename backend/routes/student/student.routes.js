const express = require("express");

const router = express.Router();

const {
    generateStudentExamPDF
} = require("../../controllers/studentPdf.controller");

const{ studentAuth} =
    require("../../middleware/roleby.access.middleware");


// ==========================================================
// STUDENT EXAM PDF
// ==========================================================

router.post(
    "/exam/studentresult",
    
    generateStudentExamPDF
);


module.exports = router;const express = require("express");

const router = express.Router();

const {
  getStudentByUsername
} = require("../../controllers/student.controller");

router.get("/getstudent", getStudentByUsername);

module.exports = router;
