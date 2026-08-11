const express = require("express");

const {
    generateExamReport
} = require("../../controllers/result.controller");

const router = express.Router();


router.get(
    "/exam-report",
    generateExamReport
);


module.exports = router;