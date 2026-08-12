const express = require("express");

const {
    generateExamReport
} = require("../../controllers/result.controller");

const router = express.Router();

const staffAuth = require("../../middleware/roleby.access.middleware");
router.get(
    "/exam-report",
    staffAuth,
    generateExamReport
);


module.exports = router;