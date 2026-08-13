const express = require("express");

const { submitExam } = require("../../controllers/exam.controller");
const { startExam, syncExam } = require("../../controllers/exam.controller");

const router = express.Router();

router.use("/startexam", startExam);
router.use("/submit", submitExam);
router.use("/examsync", syncExam);

module.exports = router;