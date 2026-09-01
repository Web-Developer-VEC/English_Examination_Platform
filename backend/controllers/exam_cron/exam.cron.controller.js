const { ObjectId } = require("mongodb");
const { getDB } = require("../../config/db");
const crypto = require("crypto");

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
    // QUESTION SET
    // ====================================================

    if (!test.questionSetId) {
      console.log(`[AUTO SUBMIT] Question set missing for test ${test._id}`);

      return;
    }

    if (!ObjectId.isValid(test.questionSetId)) {
      console.log(`[AUTO SUBMIT] Invalid questionSetId for test ${test._id}`);

      return;
    }

    const questionSet = await db.collection("questions").findOne({
      _id: new ObjectId(test.questionSetId),
    });

    if (!questionSet) {
      console.log(`[AUTO SUBMIT] Question set not found for test ${test._id}`);

      return;
    }

    // ====================================================
    // QUESTIONS
    // ====================================================

    const questions = Array.isArray(questionSet.questions)
      ? questionSet.questions
      : [];

    if (questions.length === 0) {
      console.log(`[AUTO SUBMIT] No questions found for test ${test._id}`);

      return;
    }

    // ====================================================
    // STUDENT ANSWERS
    // ====================================================

    const submittedAnswers = Array.isArray(examAttempt.answers)
      ? examAttempt.answers
      : [];

    // ====================================================
    // EVALUATION
    // ====================================================

    let obtainedMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    const evaluatedAnswers = [];

    for (const question of questions) {
      const submittedAnswer = submittedAnswers.find(
        (answer) => Number(answer.questionNo) === Number(question.questionNo),
      );

      const studentAnswer =
        submittedAnswer && submittedAnswer.studentAnswer != null
          ? String(submittedAnswer.studentAnswer).trim().toUpperCase()
          : "";

      // IMPORTANT:
      // Answer in questions collection is actual TEXT.
      //
      // Example:
      // options:
      // A: Quick
      // B: Slow
      // C: Fast
      // D: Late
      //
      // answer: "Quick"

      const correctAnswer =
        question.answer != null
          ? String(question.answer).trim().toUpperCase()
          : "";

      const isCorrect = studentAnswer !== "" && studentAnswer === correctAnswer;

      if (isCorrect) {
        obtainedMarks++;
        correctAnswers++;
      } else if (studentAnswer !== "") {
        wrongAnswers++;
      }

      evaluatedAnswers.push({
        questionNo: question.questionNo,

        question: question.question,

        options: question.options,

        studentAnswer,

        correctAnswer,

        marks: isCorrect ? 1 : 0,
      });
    }

    // ====================================================
    // RESULT
    // ====================================================

    const totalQuestions = questions.length;

    const totalMarks = totalQuestions;

    const percentage =
      totalMarks === 0
        ? 0
        : Number(((obtainedMarks / totalMarks) * 100).toFixed(2));

    const result = percentage >= 50 ? "Pass" : "Fail";

    // ====================================================
    // UPDATE EXAM
    // ====================================================

    const submittedAt = new Date();

    const updateResult = await db.collection("exam").updateOne(
      {
        _id: examAttempt._id,

        // Only submit active attempts
        status: true,
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

          status: false,

          submittedAt,

          updatedAt: submittedAt,

          autoSubmitted: true,
        },
      },
    );

  } catch (error) {
    console.error(`[AUTO SUBMIT ERROR] ${examAttempt._id}`, error);
  }
};

// ============================================================
// CHECK EXAMS
// ============================================================

const checkExams = async () => {
  try {
    const db = getDB();

    const now = new Date();

    console.log(`[EXAM CRON] Checking at ${now.toISOString()}`);

    // ====================================================
    // 1. GENERATE TEST CODE
    //    1 MINUTE BEFORE EXAM
    // ====================================================

    const schedules = await db
      .collection("schedule")
      .find({ status: "Scheduled" })
      .toArray();

    const upcomingTests = [];

    const oneMinuteFromNow = new Date(now);
    oneMinuteFromNow.setMinutes(oneMinuteFromNow.getMinutes() + 10);

    for (const test of schedules) {
      const startTime = new Date(test.startTime);

      if (startTime > now && startTime <= oneMinuteFromNow) {
        if (
          test.testcode === undefined ||
          test.testcode === null ||
          test.testcode === ""
        ) {
          upcomingTests.push(test);
        }
      }
    }
    for (const test of upcomingTests) {
      const testcode = await generateUniqueTestCode(db);

      const updateResult = await db.collection("schedule").updateOne(
        {
          _id: test._id,

          status: "Scheduled",

          $or: [
            {
              testcode: {
                $exists: false,
              },
            },

            {
              testcode: null,
            },

            {
              testcode: "",
            },
          ],
        },

        {
          $set: {
            testcode,

            testcodeGeneratedAt: new Date(),

            updatedAt: new Date(),
          },
        },
      );

    }

    // ====================================================
    // 2. START EXAMS
    // ====================================================

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
          },
        );

        console.log(`[EXAM CRON] Exam started: ${test._id}`);
      }
    }

    // ====================================================
    // 3. FIND EXPIRED EXAMS
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

    // ====================================================
    // 4. PROCESS EXPIRED EXAMS
    // ====================================================

    for (const test of expiredTests) {
      console.log(`[EXAM CRON] Exam ended: ${test._id}`);

      // =================================================
      // FIND ACTIVE STUDENT ATTEMPTS
      // =================================================

      const activeAttempts = await db
        .collection("exam")
        .find({
          testId: test._id,

          status: true,
        })
        .toArray();

      console.log(`[EXAM CRON] Active attempts: ${activeAttempts.length}`);

      // =================================================
      // AUTO SUBMIT EACH ATTEMPT
      // =================================================

      for (const attempt of activeAttempts) {
        await autoSubmitExam(db, attempt, test);
      }

      // =================================================
      // MARK SCHEDULE COMPLETED
      // =================================================

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
        },
      );

      console.log(`[EXAM CRON] Exam marked Completed: ${test._id}`);
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
};
