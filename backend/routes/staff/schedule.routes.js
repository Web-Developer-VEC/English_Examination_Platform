const express = require("express");

const router = express.Router();

const {
  getformdata,
  getScheduledExams,
} = require("../../controllers/general_admin/getscheduleexam.controller");
const { scheduleExam } = require("../../controllers/admin/schedule.controller");
const {
  deleteScheduledExam,
} = require("../../controllers/admin/delete.schedule.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

router.get("/getformdata", roleByAccess(["admin", "staff"]), getformdata);
router.get(
  "/getscheduleexams",
  roleByAccess(["admin", "staff"]),
  getScheduledExams,
);
router.post("/scheduleexam", roleByAccess(["admin"]), scheduleExam);
router.delete(
  "/delete-scheduled-exam",
  roleByAccess(["admin"]),
  deleteScheduledExam,
);

module.exports = router;
