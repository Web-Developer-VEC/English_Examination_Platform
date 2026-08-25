const { getDB } = require("../config/db");
const { generateStudentExamPDF } = require("../service/student_result.service");

const checkCompletedExams = async () => {
  try {
    const db = getDB();
    const now = new Date();

    const schedule = await db
      .collection("schedule")
      .find({
        status: "Completed",

        result: {
          $ne: "mailed",
        },

        // Current time >= endTime + 10 minutes
        $expr: {
          $lte: [
            {
              $dateAdd: {
                startDate: "$endTime",
                unit: "minute",
                amount: 10,
              },
            },
            now,
          ],
        },
      })
      .toArray();

    console.log(`Found ${schedule.length} completed schedules`);

    for (const test of schedule) {
      const admissionNos = test.eligibility?.admissionNo || [];

      console.log(`Checking test: ${test._id}`);

      for (const admissionNo of admissionNos) {
        try {
          await generateStudentExamPDF(test._id, admissionNo);

          console.log(`Result generated: ${test._id} - ${admissionNo}`);
        } catch (error) {
          // Student didn't attend / exam attempt doesn't exist
          if (error.message === "Student exam attempt not found.") {
            console.log(
              `Skipping (no exam attempt): ${test._id} - ${admissionNo}`,
            );

            continue;
          }

          // Other errors
          console.error(`Failed for ${test._id} - ${admissionNo}`, error);

          // Continue with other students instead of stopping cron
          continue;
        }
      }

      // Mark test as processed after checking all students
      await db.collection("schedule").updateOne(
        { _id: test._id },
        {
          $set: {
            result: "mailed",
            resultMailedAt: new Date(),
          },
        },
      );

      console.log(`Schedule processed: ${test._id}`);
    }

    return {
      success: true,
      processedTests: schedule.length,
    };
  } catch (error) {
    console.error("checkCompletedExams error:", error);

    throw error;
  }
};

module.exports = {
  checkCompletedExams,
};
