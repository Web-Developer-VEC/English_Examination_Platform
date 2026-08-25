const express = require("express");

const {
  submitExam,
  startExam,
  syncExam,
} = require("../../controllers/exam.controller");
const {
  reportMalpractice,
} = require("../../controllers/malpractice.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

const router = express.Router();

router.use("/startexam", roleByAccess(["student"]), startExam);
router.use("/submit", roleByAccess(["student"]), submitExam);
router.use("/examsync", roleByAccess(["student"]), syncExam);
router.post("/malpractice", roleByAccess(["student"]), reportMalpractice);

module.exports = router;
