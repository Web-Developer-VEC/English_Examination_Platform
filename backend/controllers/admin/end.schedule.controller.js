const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");
const { autoSubmitExam } = require("../exam_cron/exam.cron.controller");
const { generateStudentExamPDF } = require("../../service/student_result.service");
const {
  generateAndSaveClassReportForSchedule,
} = require("../../service/class_report.service");

// ============================================================
// END SCHEDULED EXAM CONTROLLER
// ============================================================
const endScheduledExam = async (req, res) => {
  try {
    const { testId } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================
    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "testId is required.",
      });
    }

    if (!ObjectId.isValid(testId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid testId.",
      });
    }

    const db = getDB();
    const testObjectId = new ObjectId(testId);

    // =====================================================
    // FIND SCHEDULED EXAM
    // =====================================================
    const exam = await db.collection("schedule").findOne({
      _id: testObjectId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Scheduled exam not found.",
      });
    }

    if (exam.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Exam is already completed.",
      });
    }

    // =====================================================
    // 1. AUTO SUBMIT ANY ACTIVE STUDENT ATTEMPTS
    // =====================================================
    const activeAttempts = await db
      .collection("exam")
      .find({
        testId: { $in: [testObjectId, String(testId)] },
        status: true,
      })
      .toArray();

    console.log(
      `[END TEST] Auto-submitting ${activeAttempts.length} active attempts for test ${testId}`
    );

    for (const attempt of activeAttempts) {
      await autoSubmitExam(db, attempt, exam);
    }

    // =====================================================
    // 2. MARK SCHEDULE AS COMPLETED
    // =====================================================
    const now = new Date();
    await db.collection("schedule").updateOne(
      { _id: testObjectId },
      {
        $set: {
          status: "Completed",
          completedAt: now,
          endTime: exam.endTime || now,
          updatedAt: now,
        },
      }
    );

    console.log(`[END TEST] Exam ${testId} marked as Completed.`);

    await db.collection("exam").updateMany(
      { testId: { $in: [testObjectId, String(testId)] } },
      { $set: { allowResume: false } }
    );

    // =====================================================
    // 3. TRIGGER CLASS CIE REPORT GENERATION IN RESULT COLLECTION
    // =====================================================
    generateAndSaveClassReportForSchedule(testObjectId).catch((err) => {
      console.error(
        `[END TEST] Error generating class report for test ${testId}:`,
        err.message
      );
    });

    // =====================================================
    // 4. CHECK CATEGORY FOR STUDENT REPORT MAILING
    // =====================================================
    const isUniversity =
      String(exam.category || "").trim().toLowerCase() === "university";

    if (isUniversity) {
      await db.collection("schedule").updateOne(
        { _id: testObjectId },
        {
          $set: {
            result: "skipped",
            resultSkippedAt: now,
            resultNote: "No student reports for university examination",
          },
        }
      );

      return res.status(200).json({
        success: true,
        message:
          "Exam ended successfully. Class report updated in result collection. Student reports are not generated for university examinations.",
        testId,
      });
    }

    // =====================================================
    // 4. FIND ALL ATTEMPTS TO SEND RESULT EMAILS (NON-UNIVERSITY)
    // =====================================================
    const allAttempts = await db
      .collection("exam")
      .find({
        testId: { $in: [testObjectId, String(testId)] },
      })
      .toArray();

    const admissionNos = [
      ...new Set(allAttempts.map((a) => a.admissionNo).filter(Boolean)),
    ];

    console.log(
      `[END TEST] Found ${admissionNos.length} students who attempted test ${testId}. Preparing reports...`
    );

    // Send immediate success response to client so UI does not time out
    res.status(200).json({
      success: true,
      message:
        admissionNos.length > 0
          ? `Exam ended successfully. Result reports are being dispatched to ${admissionNos.length} student(s).`
          : "Exam ended successfully. No student attempts were recorded.",
      testId,
      studentCount: admissionNos.length,
    });

    // Run PDF generation and email sending in background
    (async () => {
      try {
        for (const admissionNo of admissionNos) {
          try {
            await generateStudentExamPDF(testId, admissionNo);
          } catch (err) {
            console.error(
              `[END TEST] Error sending report for admissionNo ${admissionNo}:`,
              err.message
            );
          }
        }

        await db.collection("schedule").updateOne(
          { _id: testObjectId },
          {
            $set: {
              result: "mailed",
              resultMailedAt: new Date(),
            },
          }
        );

        console.log(
          `[END TEST] Finished sending reports for test ${testId}`
        );
      } catch (bgError) {
        console.error(
          `[END TEST BG ERROR] Error processing student reports:`,
          bgError
        );
      }
    })();
  } catch (error) {
    console.error("END SCHEDULED EXAM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end scheduled exam.",
      error: error.message || "Unexpected server error.",
    });
  }
};

module.exports = {
  endScheduledExam,
};
