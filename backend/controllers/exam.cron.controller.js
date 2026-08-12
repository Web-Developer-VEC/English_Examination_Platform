const cron = require("node-cron");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const crypto = require("crypto");

const generateUniqueTestCode = async (db) => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

const checkExams = async () => {
  try {
    const db = getDB();
    const now = new Date();

    console.log(`[EXAM CRON] Checking at ${now.toISOString()}`);

    // ========================================================
    // 1. GENERATE TEST CODE 1 MINUTE BEFORE START
    // ========================================================

    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

    const upcomingTests = await db
      .collection("schedule")
      .find({
        startTime: {
          $gt: now,
          $lte: oneMinuteFromNow,
        },

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
      })
      .toArray();

    console.log(
      `[EXAM CRON] Tests requiring testcode: ${upcomingTests.length}`,
    );

    for (const test of upcomingTests) {
      const testcode = await generateUniqueTestCode(db);

      const updateResult = await db.collection("schedule").updateOne(
        {
          _id: test._id,

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
            testcode: testcode,
            testcodeGeneratedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      if (updateResult.modifiedCount === 1) {
        console.log(`[EXAM CRON] Test code generated`);

        console.log(`Test ID   : ${test._id}`);

        console.log(`Test Code : ${testcode}`);

        console.log(`Start Time: ${test.startTime}`);
      } else {
        console.log(`[EXAM CRON] Testcode was not generated for ${test._id}`);
      }
    }

    // ========================================================
    // 2. START EXAMS
    // ========================================================

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

    // ========================================================
    // 3. FIND EXPIRED EXAMS
    // ========================================================

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
      console.log(`[EXAM CRON] Exam ended: ${test._id}`);

      // ====================================================
      // FIND ACTIVE ATTEMPTS
      // ====================================================

      const activeAttempts = await db
        .collection("exam")
        .find({
          testId: test._id,
          status: true,
        })
        .toArray();

      console.log(`[EXAM CRON] Active attempts: ${activeAttempts.length}`);

      // ====================================================
      // AUTO SUBMIT
      // ====================================================

      for (const attempt of activeAttempts) {
        await autoSubmitExam(db, attempt, test);
      }

      // ====================================================
      // MARK SCHEDULE COMPLETED
      // ====================================================

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

module.exports = {
  checkExams,
};
