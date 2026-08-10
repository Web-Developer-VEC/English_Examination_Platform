const express = require("express");

const router = express.Router();
const staffAuth = require("../../middleware/roleby.access.middleware");

const questions_upload_Middleware = require("../../middleware/questionupload_middleware");
const { questionsupload } = require("../../controllers/questions.controller");
const { scheduleExam} = require("../../controllers/schedule.controller");
const {startExam, syncExam} = require("../../controllers/exam.controller");

const {submitExam} = require("../../controllers/exam.controller");

// Upload Audio + Excel
router.post(
    "/questionsupload",
    staffAuth,
    questions_upload_Middleware,
    questionsupload
); 
router.post(
    "/schedule",
    staffAuth,
    scheduleExam
);       
router.post(
    "/startexam",
    
    startExam
);

router.post(
    "/submit",
   
    submitExam
);   
router.post(
    "/examsync",
    staffAuth,
   syncExam
   
);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 



module.exports = router;