const express = require("express");

const router = express.Router();

const {
  getStudentByUsername
} = require("../../controllers/student.controller");

router.get("/getstudent", getStudentByUsername);

module.exports = router;
