const express = require("express");

const {submitExam, startExam, syncExam } = require("../../controllers/exam.controller");
const {reportMalpractice} = require("../../controllers/malpractice.controller");
const { studentAuth } = require("../../middleware/roleby.access.middleware");
const router = express.Router();

router.use("/startexam",studentAuth, startExam);
router.use("/submit",studentAuth, submitExam);
router.use("/examsync",studentAuth, syncExam);
router.post(
    "/malpractice",studentAuth,
    reportMalpractice
);

module.exports = router;