const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");

// ============================================================
// RESUME STUDENT EXAM CONTROLLER (FOR ADMIN / STAFF)
// ============================================================
const resumeStudentExam = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !String(username).trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const cleanUsername = String(username).trim();
    const db = getDB();

    // 1. Find student by username, admissionNo, or registerNo
    const student = await db.collection("students").findOne({
      $or: [
        { username: cleanUsername },
        { admissionNo: cleanUsername },
        { registerNo: cleanUsername },
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student "${cleanUsername}" not found.`,
      });
    }

    // 2. Find active/unsubmitted exam attempt
    const activeExam = await db.collection("exam").findOne({
      admissionNo: student.admissionNo,
      status: true,
    });

    if (!activeExam) {
      return res.status(404).json({
        success: false,
        message: `No active unsubmitted exam attempt found for ${student.name || cleanUsername} (${student.admissionNo}).`,
      });
    }

    // 3. Find scheduled test details to ensure test is not already ended
    const scheduledTest = await db.collection("schedule").findOne({
      _id: activeExam.testId,
    });

    if (scheduledTest && scheduledTest.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This test has already been completed and cannot be resumed.",
      });
    }

    // 4. Mark exam attempt and student as allowed to resume (one-time use)
    await db.collection("exam").updateOne(
      { _id: activeExam._id },
      {
        $set: {
          allowResume: true,
          resumedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    await db.collection("students").updateOne(
      { _id: student._id },
      {
        $set: {
          allowResume: true,
          resumedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Test successfully unlocked for ${student.name || cleanUsername} (${student.admissionNo}). Student can now resume their exam.`,
      student: {
        name: student.name,
        admissionNo: student.admissionNo,
        username: student.username,
      },
      testId: activeExam.testId,
      testCode: scheduledTest?.testcode || null,
    });
  } catch (error) {
    console.error("RESUME STUDENT EXAM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resume student exam.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  resumeStudentExam,
};
