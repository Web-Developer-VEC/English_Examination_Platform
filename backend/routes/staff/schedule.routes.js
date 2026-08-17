const express = require("express");

const router = express.Router();
const staffAuth = require("../../middleware/roleby.access.middleware");
const {getScheduleData,getScheduledExams} = require("../../controllers/getscheduleexam.controller");
const {scheduleExam} = require("../../controllers/schedule.controller");
router.get(
    "/getscheduledata",
    getScheduleData
);
router.get(
    "/getscheduleexams",
    getScheduledExams
);
router.post(
    "/scheduleexam",
    staffAuth,
    scheduleExam
);

module.exports = router;