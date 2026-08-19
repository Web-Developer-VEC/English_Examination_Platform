const express = require("express");

const router = express.Router();

const {
  getScheduleData,
  getScheduledExams,
} = require("../../controllers/getscheduleexam.controller");
const { scheduleExam } = require("../../controllers/schedule.controller");
// const {uploadHTMLToS3}=require("../../controllers/upload")
router.get("/getscheduledata", getScheduleData);
router.get("/getscheduleexams", getScheduledExams);
router.post("/scheduleexam", scheduleExam);
// router.post("/upload",uploadHTMLToS3)
module.exports = router;
