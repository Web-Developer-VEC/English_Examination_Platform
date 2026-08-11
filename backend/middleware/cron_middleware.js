const Cron = require("node-cron");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { checkExams } = require("../controllers/exam.cron.controller");





const startExamCron = () => {

    Cron.schedule("* * * * *", async () => {

        console.log("[CRON] Checking exams...");

        try {
            await checkExams();
        } catch (error) {
            console.error("[CRON ERROR]", error);
        }

    }, {
        timezone: "Asia/Kolkata"
    });

    console.log("[CRON] Exam scheduler started.");
};

module.exports = startExamCron;