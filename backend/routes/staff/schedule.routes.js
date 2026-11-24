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
const {
  endScheduledExam,
} = require("../../controllers/admin/end.schedule.controller");
const {
  activateScheduledExam,
} = require("../../controllers/admin/activate.schedule.controller");
const {
  resumeStudentExam,
} = require("../../controllers/admin/resume.student.controller");
const { roleByAccess } = require("../../middleware/roleby.access.middleware");

router.get("/getformdata", roleByAccess(["admin", "staff"]), getformdata);
router.get(
  "/getscheduleexams",
  roleByAccess(["admin", "staff"]),
  getScheduledExams,
);
router.post("/scheduleexam", roleByAccess(["admin"]), scheduleExam);
router.post(
  "/delete-scheduled-exam",
  roleByAccess(["admin"]),
  deleteScheduledExam,
);
router.post(
  "/end-test",
  roleByAccess(["admin", "staff"]),
  endScheduledExam,
);
router.post(
  "/activate-test",
  roleByAccess(["admin"]),
  activateScheduledExam,
);
router.post(
  "/resume-student-exam",
  roleByAccess(["admin", "staff"]),
  resumeStudentExam,
);

module.exports = router;
