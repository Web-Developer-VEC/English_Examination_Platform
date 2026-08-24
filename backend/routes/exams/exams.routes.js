const express = require("express");

const {submitExam, startExam, syncExam } = require("../../controllers/exam.controller");
const {reportMalpractice} = require("../../controllers/malpractice.controller");

const router = express.Router();

router.use("/startexam",startExam);
router.use("/submit",submitExam);
router.use("/examsync",syncExam);
router.post(
    "/malpractice",
    reportMalpractice
);

module.exports = router;