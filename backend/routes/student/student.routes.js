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


module.exports = router;