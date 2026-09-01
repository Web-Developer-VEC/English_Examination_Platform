const Cron = require("node-cron");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { checkExams } = require("../controllers/exam_cron/exam.cron.controller");
const { checkCompletedExams } = require("../controllers/exam_cron/auto_mail.controller");





const startExamCron = () => {

    Cron.schedule("* * * * *", async () => {

        console.log("[CRON] Checking exams...");

        try {
            await checkExams();
            await checkCompletedExams();
        } catch (error) {
            console.error("[CRON ERROR]", error);
        }

    });

    console.log("[CRON] Exam scheduler started.");
};

module.exports = startExamCron;