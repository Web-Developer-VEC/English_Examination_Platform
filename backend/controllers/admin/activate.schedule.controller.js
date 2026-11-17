const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");
const { isWithinExamHoursIST } = require("../../helper/ist_converter");

const generateUniqueTestCode = async (db) => {
  const digits = "0123456789";

  while (true) {
    const bytes = crypto.randomBytes(6);
    const testcode = Array.from(bytes, (byte) => digits[byte % digits.length]).join("");
    const existing = await db.collection("schedule").findOne({ testcode });
    if (!existing) return testcode;
  }
};

const activateScheduledExam = async (req, res) => {
  try {
    const { testId } = req.body;
    if (!testId || !ObjectId.isValid(testId)) {
      return res.status(400).json({ success: false, message: "A valid testId is required." });
    }

    const db = getDB();
    const _id = new ObjectId(testId);
    const exam = await db.collection("schedule").findOne({ _id });
    if (!exam) {
      return res.status(404).json({ success: false, message: "Scheduled test not found." });
    }
    if (exam.status === "Completed") {
      return res.status(400).json({ success: false, message: "A completed test cannot be activated." });
    }

    const now = new Date();
    if (!isWithinExamHoursIST(now)) {
      return res.status(400).json({
        success: false,
        message: "Tests can only be activated during college exam hours (8:30 AM–5:00 PM IST).",
      });
    }

    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return res.status(400).json({ success: false, message: "The test has invalid start or end times." });
    }

    const activationOpensAt = new Date(startTime.getTime() - 10 * 60 * 1000);
    if (now < activationOpensAt || now >= endTime) {
      return res.status(400).json({
        success: false,
        message: now < activationOpensAt
          ? "Activation is available starting 10 minutes before the test begins."
          : "The scheduled test window has ended.",
      });
    }

    const testcode = exam.testcode || await generateUniqueTestCode(db);
    const status = now >= startTime ? "Started" : exam.status;
    const update = await db.collection("schedule").updateOne(
      {
        _id,
        status: { $ne: "Completed" },
        ...(exam.testcode ? { testcode: exam.testcode } : {
          $or: [{ testcode: { $exists: false } }, { testcode: null }, { testcode: "" }],
        }),
      },
      {
        $set: {
          testcode,
          testcodeGeneratedAt: exam.testcodeGeneratedAt || now,
          ...(status === "Started" && exam.status !== "Started" ? { startedAt: now } : {}),
          status,
          updatedAt: now,
        },
      },
    );

    if (update.modifiedCount !== 1) {
      return res.status(409).json({ success: false, message: "The test changed while it was being activated. Refresh and try again." });
    }

    return res.status(200).json({
      success: true,
      message: status === "Started" ? "Test activated successfully." : "Test code generated successfully.",
      testcode,
      status,
    });
  } catch (error) {
    console.error("ACTIVATE SCHEDULED TEST ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to activate the test." });
  }
};

module.exports = { activateScheduledExam };
