const express = require("express");

const router = express.Router();

const student_upload_Middleware = require("../../middleware/student_upload_middleware");
const { studentsUpload } = require("../../controllers/student.controller");

// Upload Student Excel
router.post(
    "/studentsupload",
    student_upload_Middleware,
    studentsUpload
);

module.exports = router;