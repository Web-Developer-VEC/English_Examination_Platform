const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");
const crypto = require("crypto");
const {
  generateAndSaveClassReportForSchedule,
} = require("../../service/class_report.service");
const {
  getISTMinutes,
  isWithinExamHoursIST,
  EXAM_START_MINUTES_IST,
  EXAM_END_MINUTES_IST,
} = require("../../helper/ist_converter");

// ============================================================
// GENERATE UNIQUE TEST CODE
// ============================================================

const generateUniqueTestCode = async (db) => {
  const characters = "1234567890";

  while (true) {
    const bytes = crypto.randomBytes(6);

    let code = "";

    for (let i = 0; i < 6; i++) {
      code += characters[bytes[i] % characters.length];
    }

    const existing = await db.collection("schedule").findOne({
      testcode: code,
    });

    if (!existing) {
      return code;
    }
  }
};

// ============================================================
// AUTO SUBMIT EXAM
// ============================================================

const autoSubmitExam = async (db, examAttempt, test) => {
  try {
    // ====================================================
    // 1. RESOLVE SCHEDULE (TEST) IF NOT PROVIDED
    // ====================================================

    if (!test && examAttempt.testId) {
      test = await db.collection("schedule").findOne({
        $or: [
          ...(ObjectId.isValid(examAttempt.testId)
            ? [{ _id: new ObjectId(examAttempt.testId) }]
            : []),
          { _id: examAttempt.testId },
        ],
      });
    }

    // ====================================================
    // 2. QUESTION SET
    // ====================================================

    const questionSetId = test?.questionSetId || examAttempt.questionSetId;

    if (!questionSetId && !examAttempt.questionCode && !test?.questionCode) {
      console.log(
        `[AUTO SUBMIT] Question set identifier missing for attempt ${examAttempt._id}`
      );
      return;
    }

    const questionSetQuery = {
      $or: [
        ...(questionSetId && ObjectId.isValid(questionSetId)
          ? [{ _id: new ObjectId(questionSetId) }]
          : []),
        ...(questionSetId ? [{ _id: String(questionSetId) }] : []),
        ...(examAttempt.questionCode
          ? [{ questionCode: String(examAttempt.questionCode).trim() }]
          : []),
        ...(test?.questionCode
          ? [{ questionCode: String(test.questionCode).trim() }]
          : []),
      ],
    };

    const questionSet = await db.collection("questions").findOne(questionSetQuery);

    if (!questionSet) {
      console.log(
        `[AUTO SUBMIT] Question set not found for attempt ${examAttempt._id}`
      );
      return;
    }

    // ====================================================
    // 3. QUESTIONS
    // ====================================================

    const questions = Array.isArray(questionSet.questions)
      ? questionSet.questions
      : [];

    if (questions.length === 0) {
      console.log(
        `[AUTO SUBMIT] No questions found for question set ${questionSet._id}`
      );
      return;
    }

    // ====================================================
    // 4. STUDENT ANSWERS
    // ====================================================

    const submittedAnswers = Array.isArray(examAttempt.answers)
      ? examAttempt.answers
      : [];

    // ====================================================
    // 5. EVALUATION
    // ====================================================

    let obtainedMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    const evaluatedAnswers = [];

    for (const question of questions) {
      const submittedAnswer = submittedAnswers.find(
        (answer) => Number(answer.questionNo) === Number(question.questionNo)
      );

      const studentAnswer =
        submittedAnswer && submittedAnswer.studentAnswer != null
          ? String(submittedAnswer.studentAnswer).trim().toUpperCase()
          : "";

      const correctAnswer =
        question.answer != null
          ? String(question.answer).trim().toUpperCase()
          : "";

      let isCorrect = false;

      if (studentAnswer !== "" && correctAnswer !== "") {
        if (studentAnswer === correctAnswer) {
          isCorrect = true;
        } else if (question.options && typeof question.options === "object") {
          // Check if studentAnswer is key (e.g. "A") and correctAnswer is text (e.g. "FAST")
          const studentOptionVal =
            question.options[studentAnswer] ||
            question.options[studentAnswer.toLowerCase()];
          if (
            studentOptionVal &&
            String(studentOptionVal).trim().toUpperCase() === correctAnswer
          ) {
            isCorrect = true;
          }

          // Check if correctAnswer is key (e.g. "A") and studentAnswer is text (e.g. "FAST")
          const correctOptionVal =
            question.options[correctAnswer] ||
            question.options[correctAnswer.toLowerCase()];
          if (
            correctOptionVal &&
            String(correctOptionVal).trim().toUpperCase() === studentAnswer
          ) {
            isCorrect = true;
          }
        }
      }

      if (isCorrect) {
        obtainedMarks++;
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      evaluatedAnswers.push({
        questionNo: question.questionNo,
        question: question.question || question.questionText || "",
        options: question.options,
        studentAnswer,
        correctAnswer,
        marks: isCorrect ? 1 : 0,
      });
    }

    // ====================================================
    // 6. RESULT
    // ====================================================

    const totalQuestions = questions.length;
    const totalMarks = totalQuestions;

    const percentage =
      totalMarks === 0
        ? 0
        : Number(((obtainedMarks / totalMarks) * 100).toFixed(2));

    const result = percentage >= 50 ? "Pass" : "Fail";

    // ====================================================
    // 7. UPDATE EXAM
    // ====================================================

    const submittedAt = new Date();

    const updateResult = await db.collection("exam").updateOne(
      {
        _id: examAttempt._id,
        $or: [
          { status: true },
          { result: "Pending" },
          { obtainedMarks: { $exists: false } },
        ],
      },
      {
        $set: {
          answers: evaluatedAnswers,
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          obtainedMarks,
          totalMarks,
          percentage,
          result,
          malpractice: {
            status: false,
            reason: "",
          },
          allowResume: false,
          status: false,
          timeRemaining: 0,
          submittedAt: examAttempt.submittedAt || submittedAt,
          updatedAt: submittedAt,
          autoSubmitted: true,
          autoSubmittedReason: "duration_expired",
        },
      }
    );

    if (examAttempt.admissionNo) {
      await db.collection("students").updateOne(
        { admissionNo: String(examAttempt.admissionNo).trim() },
        { $set: { allowResume: false } }
      );
    }

    console.log(
      `[AUTO SUBMIT] Successfully evaluated attempt ${examAttempt._id} for student ${examAttempt.admissionNo}: ${obtainedMarks}/${totalMarks} (${result})`
    );
  } catch (error) {
    console.error(`[AUTO SUBMIT ERROR] ${examAttempt?._id}`, error);
  }
};

// ============================================================
// CHECK EXAMS
// ============================================================

const checkExams = async () => {
  try {
    const db = getDB();

    const now = new Date();

    // ====================================================
    // 1. GENERATE TEST CODE (FROM 10 MINUTES BEFORE START UNTIL EXAM END)
    // ====================================================

    if (isWithinExamHoursIST(now)) {
      const schedules = await db
        .collection("schedule")
        .find({ status: { $in: ["Scheduled", "Started"] } })
        .toArray();

      for (const test of schedules) {
        if (test.testcode !== undefined && test.testcode !== null && test.testcode !== "") {
          continue;
        }

        const startTime = new Date(test.startTime);
        const endTime = new Date(test.endTime);
        if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
          continue;
        }

        const generationOpensAt = new Date(startTime.getTime() - 10 * 60 * 1000);
        if (now < generationOpensAt || now >= endTime) {
          continue;
        }

        const testcode = await generateUniqueTestCode(db);
        const result = await db.collection("schedule").updateOne(
          {
            _id: test._id,
            status: { $in: ["Scheduled", "Started"] },
            $or: [
              { testcode: { $exists: false } },
              { testcode: null },
              { testcode: "" },
            ],
          },
          {
            $set: {
              testcode,
              testcodeGeneratedAt: now,
              updatedAt: now,
            },
          },
        );

        if (result.modifiedCount === 1) {
          console.log(`[EXAM CRON] Test code generated for schedule ${test._id}`);
        }
      }
    }

    // ====================================================
    // 2. START EXAMS (ONLY DURING ALLOWED HOURS 8:30 AM - 5:00 PM IST)
    // ====================================================

    if (isWithinExamHoursIST(now)) {
      const testsToStart = await db
        .collection("schedule")
        .find({
          startTime: {
            $lte: now,
          },
          endTime: {
            $gt: now,
          },
          status: {
            $ne: "Completed",
          },
        })
        .toArray();

    for (const test of testsToStart) {
      if (test.status !== "Started") {
        await db.collection("schedule").updateOne(
          {
            _id: test._id,
            status: {
              $ne: "Completed",
            },
          },
          {
            $set: {
              status: "Started",
              startedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );

        console.log(`[EXAM CRON] Exam started: ${test._id}`);
      }
    }
  }

    // ====================================================
    // 3. CHECK AND AUTO-EVALUATE EXAM ATTEMPTS WHOSE DURATION HAS EXPIRED
    // ====================================================

    const activeAttempts = await db
      .collection("exam")
      .find({
        $or: [
          { status: true },
          { result: "Pending" },
        ],
        result: { $ne: "Malpractice" },
      })
      .toArray();

    if (activeAttempts.length > 0) {
      const scheduleIds = [
        ...new Set(
          activeAttempts
            .map((a) => a.testId)
            .filter(Boolean)
            .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id))
        ),
      ];

      const schedulesList =
        scheduleIds.length > 0
          ? await db
              .collection("schedule")
              .find({ _id: { $in: scheduleIds } })
              .toArray()
          : [];

      const scheduleMap = new Map();
      for (const s of schedulesList) {
        scheduleMap.set(String(s._id), s);
      }

      const affectedScheduleIds = new Set();

      for (const attempt of activeAttempts) {
        const test = attempt.testId
          ? scheduleMap.get(String(attempt.testId))
          : null;

        const durationMinutes = Number(
          test?.duration || attempt.duration || 0
        );
        const durationMs = durationMinutes * 60 * 1000;

        let isExpired = false;
        let expireReason = "";

        // A. Synced timeRemaining reached zero
        if (
          attempt.timeRemaining != null &&
          Number(attempt.timeRemaining) <= 0
        ) {
          isExpired = true;
          expireReason = "time_remaining_zero";
        }

        // B. Duration elapsed since start or resume
        if (!isExpired && durationMinutes > 0) {
          const GRACE_PERIOD_MS = 30 * 1000; // 30-second grace window

          if (
            attempt.lastResumedAt &&
            attempt.timeRemaining != null &&
            Number(attempt.timeRemaining) > 0
          ) {
            const allowedMs = Number(attempt.timeRemaining) * 1000;
            const elapsedSinceResume =
              now.getTime() - new Date(attempt.lastResumedAt).getTime();
            if (elapsedSinceResume >= allowedMs + GRACE_PERIOD_MS) {
              isExpired = true;
              expireReason = "resumed_duration_elapsed";
            }
          } else if (attempt.startedAt) {
            const elapsedSinceStart =
              now.getTime() - new Date(attempt.startedAt).getTime();
            if (elapsedSinceStart >= durationMs + GRACE_PERIOD_MS) {
              isExpired = true;
              expireReason = "duration_elapsed";
            }
          }
        }

        // C. Overall scheduled test window has ended
        if (!isExpired && test?.endTime) {
          const scheduleEndTime = new Date(test.endTime);
          if (scheduleEndTime <= now) {
            isExpired = true;
            expireReason = "schedule_end_time_passed";
          }
        }

        // D. Attempt already closed (status === false) but marks never evaluated (result === "Pending")
        if (
          !isExpired &&
          attempt.status === false &&
          attempt.result === "Pending"
        ) {
          isExpired = true;
          expireReason = "status_closed_pending_evaluation";
        }

        // E. Current IST time is outside allowed exam hours (>= 5:00 PM IST or < 8:30 AM IST)
        if (!isExpired) {
          const istMinutesNow = getISTMinutes(now);
          if (
            istMinutesNow >= EXAM_END_MINUTES_IST ||
            istMinutesNow < EXAM_START_MINUTES_IST
          ) {
            isExpired = true;
            expireReason = "outside_allowed_hours_830am_to_5pm_ist";
          }
        }

        if (isExpired) {
          console.log(
            `[EXAM CRON] Attempt ${attempt._id} for student ${attempt.admissionNo} ended due to ${expireReason}. Auto-evaluating marks...`
          );
          await autoSubmitExam(db, attempt, test);

          if (attempt.testId) {
            affectedScheduleIds.add(String(attempt.testId));
          }
        }
      }

      // Update class report for any schedules whose student attempts were evaluated
      for (const scheduleId of affectedScheduleIds) {
        generateAndSaveClassReportForSchedule(scheduleId).catch((err) => {
          console.error(
            `[EXAM CRON] Error updating class report for schedule ${scheduleId}:`,
            err.message
          );
        });
      }
    }

    // ====================================================
    // 4. FIND AND PROCESS EXPIRED SCHEDULES
    // ====================================================

    const expiredTests = await db
      .collection("schedule")
      .find({
        endTime: {
          $lte: now,
        },
        status: {
          $ne: "Completed",
        },
      })
      .toArray();

    for (const test of expiredTests) {
      console.log(`[EXAM CRON] Exam schedule ended: ${test._id}`);

      // Auto submit any remaining active attempts for this test
      const activeAttemptsForTest = await db
        .collection("exam")
        .find({
          testId: { $in: [test._id, String(test._id)] },
          $or: [{ status: true }, { result: "Pending" }],
          result: { $ne: "Malpractice" },
        })
        .toArray();

      for (const attempt of activeAttemptsForTest) {
        await autoSubmitExam(db, attempt, test);
      }

      // Mark schedule Completed
      await db.collection("schedule").updateOne(
        {
          _id: test._id,
        },
        {
          $set: {
            status: "Completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      console.log(`[EXAM CRON] Exam marked Completed: ${test._id}`);

      // Generate and store class CIE report in result collection
      generateAndSaveClassReportForSchedule(test._id).catch((err) => {
        console.error(
          `[EXAM CRON] Error generating class report for test ${test._id}:`,
          err.message
        );
      });
    }
  } catch (error) {
    console.error("[EXAM CRON ERROR]", error);
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  checkExams,
  autoSubmitExam,
};
