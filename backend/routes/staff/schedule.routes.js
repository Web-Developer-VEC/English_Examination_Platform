const express = require("express");

const router = express.Router();

const { getformdata, getScheduledExams} = require("../../controllers/getscheduleexam.controller");
const { scheduleExam } = require("../../controllers/schedule.controller");
const{deleteScheduledExam}=require("../../controllers/delete.schedule.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

router.get("/getformdata", roleByAccess(["admin","staff"]),getformdata);
router.get("/getscheduleexams", roleByAccess(["admin"]),getScheduledExams);
router.post("/scheduleexam",roleByAccess(["admin"]) ,scheduleExam);
router.delete("/delete-scheduled-exam", roleByAccess(["admin"]),deleteScheduledExam);

module.exports = router;
