const express = require("express");

const router = express.Router();

const questions_upload_Middleware = require("../../middleware/questionupload_middleware");
const { questionsupload } = require("../../controllers/questions.controller");

// Upload Audio + Excel
router.post(
    "/questionsupload",
    questions_upload_Middleware,
    questionsupload
);



module.exports = router;